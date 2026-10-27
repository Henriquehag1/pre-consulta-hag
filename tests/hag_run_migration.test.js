'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/202610270001_hag_run.sql'), 'utf8').toLowerCase();
test('migration keeps program, prescription and execution in separate additive tables', () => {
  for (const table of ['hag_run_programs', 'hag_run_prescriptions', 'hag_run_executions']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(sql, /foreign key \(program_id, user_id\).*hag_run_programs/);
  assert.match(sql, /foreign key \(prescription_id, user_id\).*hag_run_prescriptions/);
  assert.match(sql, /alter table public\.hag_run_executions force row level security/);
});

test('migration scopes every table to auth.uid and denies anonymous access', () => {
  assert.equal((sql.match(/using \(user_id = \(select auth\.uid\(\)\)\)/g) || []).length, 3);
  assert.equal((sql.match(/with check \(user_id = \(select auth\.uid\(\)\)\)/g) || []).length, 3);
  assert.match(sql, /revoke all on public\.hag_run_programs, public\.hag_run_prescriptions, public\.hag_run_executions from anon, public/);
  assert.match(sql, /revoke all on function public\.hag_run_save\(jsonb, jsonb, jsonb\) from public, anon/);
  assert.match(sql, /security invoker/);
  assert.doesNotMatch(sql, /security definer/);
  assert.match(sql, /grant select, insert on public\.hag_run_prescriptions, public\.hag_run_executions to authenticated/);
  assert.doesNotMatch(sql, /grant select, insert, update on public\.hag_run_prescriptions/);
});

test('migration validates run scales and completed-session measurements', () => {
  assert.match(sql, /rpe between 0 and 10/);
  assert.match(sql, /pain between 0 and 10/);
  assert.match(sql, /fatigue between 0 and 10/);
  assert.match(sql, /not completed or \(duration_seconds > 0 and distance_km > 0\)/);
  assert.match(sql, /begin;/);
  assert.match(sql, /commit;/);
});
