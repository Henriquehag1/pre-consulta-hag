'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/202610270001_hag_run.sql'), 'utf8').toLowerCase();
const medicalSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/202610270002_hag_run_medical_gate.sql'), 'utf8').toLowerCase();

test('migration creates isolated patient-owned program, immutable prescription snapshots and executions', () => {
  for (const table of ['hag_run_programs', 'hag_run_prescriptions', 'hag_run_executions']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(sql, /patient_id text not null references public\.patients\(id\)/);
  assert.match(sql, /foreign key \(program_id, patient_id\)[\s\S]*?hag_run_programs/);
  assert.match(sql, /foreign key \(prescription_id, patient_id\)[\s\S]*?hag_run_prescriptions/);
  assert.match(sql, /unique \(patient_id, program_id, plan_fingerprint\)/);
  assert.match(sql, /unique \(patient_id, client_event_id\)/);
  assert.match(sql, /on conflict \(patient_id, program_id, plan_fingerprint\)/);
});

test('migration enables and forces RLS while denying direct table access', () => {
  for (const table of ['hag_run_programs', 'hag_run_prescriptions', 'hag_run_executions']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`alter table public\\.${table} force row level security`));
  }
  assert.match(sql, /revoke all on public\.hag_run_programs, public\.hag_run_prescriptions, public\.hag_run_executions from public, anon, authenticated/);
  assert.doesNotMatch(sql, /create policy .*hag_run/);
  assert.doesNotMatch(sql, /service_role/i);
});

test('public RPCs are invoker wrappers and private definer functions derive patient scope from active token', () => {
  const impls = ['patient_context_impl', 'patient_save_assessment_impl', 'patient_save_execution_impl'];
  const wrappers = ['hag_run_patient_context', 'hag_run_patient_save_assessment', 'hag_run_patient_save_execution'];
  assert.match(sql, /create schema if not exists hag_run_private/);
  assert.match(sql, /grant usage on schema hag_run_private to anon/);
  for (const name of wrappers) {
    const start = sql.indexOf(`create or replace function public.${name}`);
    assert.notEqual(start, -1, `${name} exists`);
    const body = sql.slice(start, sql.indexOf('$$;', start) + 3);
    assert.match(body, /security invoker/);
    assert.match(body, /hag_run_private\./);
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\(`));
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}\\([^;]+from public, authenticated`));
  }
  for (const name of impls) {
    const start = sql.indexOf(`create or replace function hag_run_private.${name}`);
    assert.notEqual(start, -1, `${name} exists`);
    const next = sql.indexOf('create or replace function ', start + 1);
    const body = sql.slice(start, next === -1 ? sql.length : next);
    assert.match(body, /security definer/);
    assert.match(body, /set search_path = pg_catalog/);
    assert.match(body, /a\.token = p_token/);
    assert.match(body, /a\.revogado is false/);
    assert.match(body, /a\.hag_run_expires_at is null or a\.hag_run_expires_at > pg_catalog\.now\(\)/);
    assert.match(body, /select a\.patient_id into v_patient_id/);
    assert.doesNotMatch(body, /p_patient_id/);
    assert.match(sql, new RegExp(`grant execute on function hag_run_private\\.${name}\\(`));
    assert.match(sql, new RegExp(`revoke all on function hag_run_private\\.${name}\\([^;]+from public, authenticated`));
  }
});

test('RPCs scope every object lookup to the token-derived patient and sessions in their stored prescription', () => {
  const execution = sql.slice(sql.indexOf('create or replace function hag_run_private.patient_save_execution_impl'));
  const tokenCheck = execution.slice(execution.indexOf('select a.patient_id into v_patient_id'));
  const initialSessionLookup = execution.slice(tokenCheck.indexOf('select p.id, rx.id into v_program_id'));
  assert.ok(tokenCheck.indexOf('client_event_id = p_client_event_id') < tokenCheck.indexOf('select p.id, rx.id into v_program_id'),
    'idempotent retry is resolved before checking the now-current prescription');
  assert.match(execution, /pg_catalog\.pg_advisory_xact_lock\(pg_catalog\.hashtext\(v_patient_id\)\)/);
  assert.match(initialSessionLookup, /rx.plan->'sessions' @> pg_catalog.jsonb_build_array/);
  assert.match(execution, /where p\.patient_id = v_patient_id and p\.slug = 'rumo_5k'/);
  assert.match(execution, /rx\.plan->'sessions' @> pg_catalog\.jsonb_build_array/);
  assert.match(execution, /where e\.patient_id = v_patient_id and e\.client_event_id = p_client_event_id/);
  assert.match(execution, /on conflict \(patient_id, client_event_id\) do nothing/);
  assert.match(sql, /add column if not exists hag_run_expires_at timestamptz/);
  assert.match(sql, /check \(not completed or \(duration_seconds > 0 and distance_km > 0\)\)/);
});

test('patients cannot directly update prescriptions or self-authorize progression', () => {
  const assessment = sql.slice(sql.indexOf('create or replace function hag_run_private.patient_save_assessment_impl'), sql.indexOf('create or replace function hag_run_private.patient_save_execution_impl'));
  const execution = sql.slice(sql.indexOf('create or replace function hag_run_private.patient_save_execution_impl'));
  assert.match(assessment, /progression_not_authorized/);
  assert.match(assessment, /prescription_immutable/);
  assert.match(assessment, /on conflict \(patient_id, program_id, plan_fingerprint\) do nothing/);
  assert.match(assessment, /v_requested_week is null or v_requested_week not between 1 and 12/);
  assert.match(assessment, /pg_catalog\.pg_advisory_xact_lock\(pg_catalog\.hashtext\(v_patient_id\)\)/);
  assert.doesNotMatch(execution, /p_recommendation/);
  assert.match(execution, /v_action := 'professional_review'/);
  assert.match(execution, /v_action := 'reduce'/);
  assert.match(execution, /v_action := 'progress'/);
  assert.match(execution, /'last_recommendation', v_recommendation/);
});

test('migration preserves existing HAG access records and does not mutate legacy RPCs', () => {
  assert.match(sql, /alter table public\.treino_acessos\s+add column if not exists hag_run_expires_at/);
  assert.doesNotMatch(sql, /drop table|truncate|delete from public\.(patients|treino_acessos)/);
  assert.doesNotMatch(sql, /create or replace function public\.hag_treino_/);
});

test('medical gate is additive, patient token scoped, and clinician scoped server side', () => {
  for (const table of ['hag_run_assessment_requests','hag_run_clinician_patient_access','hag_run_patient_holds','hag_run_medical_authorizations','hag_run_medical_audit']) {
    assert.match(medicalSql,new RegExp(`create table if not exists public\\.${table}`));
    assert.match(medicalSql,new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(medicalSql,new RegExp(`alter table public\\.${table} force row level security`));
  }
  assert.match(medicalSql,/patient_submit_assessment_impl/);
  assert.match(medicalSql,/a\.token=p_token/);
  assert.match(medicalSql,/a\.revogado is false/);
  assert.match(medicalSql,/a\.hag_run_expires_at is null or a\.hag_run_expires_at>pg_catalog\.now\(\)/);
  assert.match(medicalSql,/auth\.uid\(\)/);
  assert.match(medicalSql,/adult_population_required/);
  assert.match(medicalSql,/active_urgent_symptom_requires_resolution/);
  assert.match(medicalSql,/running_not_in_authorized_scope/);
  assert.match(medicalSql,/restricted_instructions_required/);
  assert.match(medicalSql,/a\.clinician_user_id=v_user and a\.patient_id=p_patient_id and a\.revoked_at is null/);
  assert.match(medicalSql,/revoke all on function public\.hag_run_patient_save_assessment/);
  assert.match(medicalSql,/grant execute on function public\.hag_run_clinician_review\([^;]+to authenticated/);
  assert.doesNotMatch(medicalSql,/service_role/i);
  assert.doesNotMatch(medicalSql,/drop table|truncate|delete from public\.(patients|treino_acessos)/);
});
