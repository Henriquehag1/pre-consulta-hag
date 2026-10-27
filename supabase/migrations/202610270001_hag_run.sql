-- HAG RUN, armazenamento por link pessoal do HAG Treino.
-- Esta migração substitui o rascunho local baseado em auth.uid(), que não
-- corresponde à identidade dos pacientes atuais. Ainda não foi aplicada.
-- O token nunca é convertido em identidade pelo cliente. As RPCs abaixo
-- validam o token em treino_acessos e derivam patient_id exclusivamente no DB.
begin;

create schema if not exists hag_run_private;
revoke all on schema hag_run_private from public, anon, authenticated;
grant usage on schema hag_run_private to anon;

-- NULL preserva os links existentes. Um processo interno poderá definir uma
-- expiração para links HAG RUN sem alterar o formato ou o comportamento atual.
alter table public.treino_acessos
  add column if not exists hag_run_expires_at timestamptz;

create table if not exists public.hag_run_programs (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  slug text not null check (slug = 'rumo_5k'),
  selected_program jsonb not null check (jsonb_typeof(selected_program) = 'object'),
  assessment jsonb not null check (jsonb_typeof(assessment) = 'object'),
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  progression_state jsonb not null default '{}'::jsonb check (jsonb_typeof(progression_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, patient_id),
  unique (patient_id, slug)
);

create table if not exists public.hag_run_prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  program_id uuid not null,
  engine_version text not null check (length(engine_version) between 1 and 40),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  plan_fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (id, patient_id),
  unique (patient_id, program_id, plan_fingerprint),
  foreign key (program_id, patient_id)
    references public.hag_run_programs(id, patient_id) on delete cascade
);

create table if not exists public.hag_run_executions (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  program_id uuid not null,
  prescription_id uuid not null,
  session_id text not null check (length(session_id) between 1 and 120),
  client_event_id uuid not null,
  completed boolean not null,
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  distance_km numeric(7,3) not null check (distance_km between 0 and 100),
  rpe integer not null check (rpe between 0 and 10),
  difficulty text not null check (difficulty in ('easy', 'moderate', 'hard')),
  pain integer not null check (pain between 0 and 10),
  fatigue integer not null check (fatigue between 0 and 10),
  recovery text not null check (recovery in ('good', 'partial', 'poor')),
  concerning_symptoms boolean not null default false,
  injury_during_run boolean not null default false,
  recommendation jsonb not null default '{}'::jsonb check (jsonb_typeof(recommendation) = 'object'),
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  recorded_at timestamptz not null default now(),
  check (not completed or (duration_seconds > 0 and distance_km > 0)),
  unique (id, patient_id),
  unique (patient_id, client_event_id),
  foreign key (program_id, patient_id)
    references public.hag_run_programs(id, patient_id) on delete cascade,
  foreign key (prescription_id, patient_id)
    references public.hag_run_prescriptions(id, patient_id) on delete cascade
);

create index if not exists hag_run_prescriptions_patient_created_idx
  on public.hag_run_prescriptions(patient_id, created_at desc);
create index if not exists hag_run_executions_patient_recorded_idx
  on public.hag_run_executions(patient_id, recorded_at desc);
create index if not exists hag_run_executions_prescription_idx
  on public.hag_run_executions(patient_id, prescription_id, recorded_at desc);

alter table public.hag_run_programs enable row level security;
alter table public.hag_run_programs force row level security;
alter table public.hag_run_prescriptions enable row level security;
alter table public.hag_run_prescriptions force row level security;
alter table public.hag_run_executions enable row level security;
alter table public.hag_run_executions force row level security;

-- Sem grants diretos ou policies para anon/authenticated. A única porta para
-- o paciente são as RPCs SECURITY DEFINER, restritas por token ativo.
revoke all on public.hag_run_programs, public.hag_run_prescriptions, public.hag_run_executions from public, anon, authenticated;

create or replace function hag_run_private.patient_context_impl(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_patient_id text;
  v_program public.hag_run_programs%rowtype;
  v_program_payload jsonb;
  v_prescription jsonb;
  v_history jsonb;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return jsonb_build_object('ok', false, 'error', 'invalid_link');
  end if;
  select a.patient_id into v_patient_id
    from public.treino_acessos as a
    where a.token = p_token
      and a.revogado is false
      and (a.hag_run_expires_at is null or a.hag_run_expires_at > pg_catalog.now());
  if v_patient_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_link');
  end if;
  select p.* into v_program
    from public.hag_run_programs as p
    where p.patient_id = v_patient_id and p.slug = 'rumo_5k';
  if v_program.id is null then
    return jsonb_build_object('ok', true, 'program', null, 'prescription', null, 'history', '[]'::jsonb);
  end if;
  select pg_catalog.jsonb_build_object(
      'engine_version', rx.engine_version, 'plan', rx.plan, 'created_at', rx.created_at
    ) into v_prescription
    from public.hag_run_prescriptions as rx
    where rx.patient_id = v_patient_id and rx.program_id = v_program.id
    order by rx.created_at desc, rx.id desc limit 1;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', e.id, 'session_id', e.session_id, 'completed', e.completed,
      'duration_seconds', e.duration_seconds, 'distance_km', e.distance_km,
      'rpe', e.rpe, 'difficulty', e.difficulty, 'pain', e.pain,
      'fatigue', e.fatigue, 'recovery', e.recovery,
      'concerning_symptoms', e.concerning_symptoms, 'injury_during_run', e.injury_during_run,
      'recommendation', e.recommendation, 'recorded_at', e.recorded_at
    ) order by e.recorded_at, e.id), '[]'::jsonb)
    into v_history
    from (
      select ex.* from public.hag_run_executions as ex
      where ex.patient_id = v_patient_id and ex.program_id = v_program.id
      order by ex.recorded_at desc, ex.id desc limit 200
    ) as e;
  v_program_payload := pg_catalog.jsonb_build_object(
    'slug', v_program.slug,
    'selected_program', v_program.selected_program,
    'assessment', v_program.assessment,
    'profile', v_program.profile,
    'progression_state', v_program.progression_state,
    'updated_at', v_program.updated_at
  );
  return pg_catalog.jsonb_build_object(
    'ok', true,
    'program', v_program_payload,
    'prescription', v_prescription,
    'history', v_history
  );
end;
$$;

create or replace function hag_run_private.patient_save_assessment_impl(
  p_token text, p_assessment jsonb, p_profile jsonb,
  p_program jsonb, p_prescription jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_patient_id text;
  v_program_id uuid;
  v_prescription_id uuid;
  v_slug text;
  v_engine text;
  v_plan jsonb;
  v_selected jsonb;
  v_current_week integer;
  v_requested_week integer;
  v_current_hash text;
  v_plan_hash text;
  v_last_action text;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_link');
  end if;
  if pg_catalog.octet_length(coalesce(p_assessment, 'null'::jsonb)::text) > 20000
     or pg_catalog.octet_length(coalesce(p_profile, 'null'::jsonb)::text) > 20000
     or pg_catalog.octet_length(coalesce(p_program, 'null'::jsonb)::text) > 4000
     or pg_catalog.octet_length(coalesce(p_prescription, 'null'::jsonb)::text) > 100000 then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'payload_too_large');
  end if;
  select a.patient_id into v_patient_id
    from public.treino_acessos as a
    where a.token = p_token
      and a.revogado is false
      and (a.hag_run_expires_at is null or a.hag_run_expires_at > pg_catalog.now());
  if v_patient_id is null then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_link');
  end if;
  -- Serializa mudanças do mesmo paciente para evitar prescrições concorrentes.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_patient_id));
  if pg_catalog.jsonb_typeof(p_assessment) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_profile) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_program) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_prescription) is distinct from 'object' then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;
  v_slug := p_program->>'slug';
  v_selected := p_program;
  v_engine := p_prescription->>'engine_version';
  v_plan := p_prescription->'plan';
  if v_slug is distinct from 'rumo_5k' or v_engine is null or pg_catalog.jsonb_typeof(v_plan) is distinct from 'object' then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  begin v_requested_week := (v_plan->>'week')::integer;
  exception when others then return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_week'); end;
  if v_requested_week is null or v_requested_week not between 1 and 12 then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_week');
  end if;
  select coalesce((p.progression_state->>'current_week')::integer, 1),
         p.progression_state->'last_recommendation'->>'action'
    into v_current_week, v_last_action
    from public.hag_run_programs as p
    where p.patient_id = v_patient_id and p.slug = v_slug;
  if not found then v_current_week := 1; v_last_action := null; end if;
  if v_requested_week <> v_current_week
     and not (v_requested_week = v_current_week + 1 and v_last_action = 'progress') then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'progression_not_authorized');
  end if;
  v_plan_hash := pg_catalog.md5(v_plan::text);
  select rx.plan_fingerprint into v_current_hash
    from public.hag_run_programs as p
    join public.hag_run_prescriptions as rx on rx.program_id = p.id and rx.patient_id = p.patient_id
    where p.patient_id = v_patient_id and p.slug = v_slug
    order by rx.created_at desc, rx.id desc limit 1;
  if v_current_hash is not null and v_requested_week = v_current_week and v_plan_hash <> v_current_hash then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'prescription_immutable');
  end if;

  insert into public.hag_run_programs as existing(patient_id, slug, selected_program, assessment, profile, progression_state)
  values (v_patient_id, v_slug, v_selected, p_assessment, p_profile,
    pg_catalog.jsonb_build_object('current_week', v_requested_week))
  on conflict (patient_id, slug) do update set
    selected_program = excluded.selected_program,
    assessment = excluded.assessment,
    profile = excluded.profile,
    progression_state = case when excluded.progression_state->>'current_week' <> existing.progression_state->>'current_week'
      then pg_catalog.jsonb_build_object('current_week', v_requested_week)
      else existing.progression_state end,
    updated_at = pg_catalog.now()
  returning id into v_program_id;

  insert into public.hag_run_prescriptions(patient_id, program_id, engine_version, plan, plan_fingerprint)
  values (v_patient_id, v_program_id, v_engine, v_plan, v_plan_hash)
  on conflict (patient_id, program_id, plan_fingerprint) do nothing
  returning id into v_prescription_id;
  if v_prescription_id is null then
    select rx.id into v_prescription_id from public.hag_run_prescriptions as rx
      where rx.patient_id = v_patient_id and rx.program_id = v_program_id and rx.plan_fingerprint = v_plan_hash;
  end if;

  return pg_catalog.jsonb_build_object('ok', true, 'program_id', v_program_id, 'prescription_id', v_prescription_id);
end;
$$;

create or replace function hag_run_private.patient_save_execution_impl(
  p_token text, p_client_event_id uuid, p_session_id text, p_execution jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_patient_id text;
  v_program_id uuid;
  v_prescription_id uuid;
  v_execution_id uuid;
  v_completed boolean;
  v_duration integer;
  v_distance numeric;
  v_rpe integer;
  v_pain integer;
  v_fatigue integer;
  v_difficulty text;
  v_recovery text;
  v_duplicate boolean := false;
  v_prior_tolerated integer := 0;
  v_action text;
  v_reason text;
  v_recommendation jsonb;
  v_existing_recommendation jsonb;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128
     or p_client_event_id is null or p_session_id is null
     or length(p_session_id) < 1 or length(p_session_id) > 120 then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_request');
  end if;
  if pg_catalog.jsonb_typeof(p_execution) is distinct from 'object' then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;
  if pg_catalog.octet_length(coalesce(p_execution, 'null'::jsonb)::text) > 30000 then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'payload_too_large');
  end if;
  select a.patient_id into v_patient_id
    from public.treino_acessos as a
    where a.token = p_token
      and a.revogado is false
      and (a.hag_run_expires_at is null or a.hag_run_expires_at > pg_catalog.now());
  if v_patient_id is null then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_link');
  end if;
  -- Primeiro resolve retries já gravados. Um retry continua idempotente mesmo
  -- depois que o paciente avançou para uma prescrição nova.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_patient_id));
  select e.id, e.recommendation into v_execution_id, v_existing_recommendation
    from public.hag_run_executions as e
    where e.patient_id = v_patient_id and e.client_event_id = p_client_event_id;
  if v_execution_id is not null then
    return pg_catalog.jsonb_build_object('ok', true, 'execution_id', v_execution_id,
      'duplicate', true, 'recommendation', v_existing_recommendation);
  end if;
  select p.id, rx.id into v_program_id, v_prescription_id
    from public.hag_run_programs as p
    join public.hag_run_prescriptions as rx on rx.program_id = p.id and rx.patient_id = p.patient_id
    where p.patient_id = v_patient_id and p.slug = 'rumo_5k'
      and (rx.plan->>'week')::integer = coalesce((p.progression_state->>'current_week')::integer, (rx.plan->>'week')::integer)
      and rx.plan->'sessions' @> pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('id', p_session_id))
    order by rx.created_at desc, rx.id desc limit 1;
  if v_program_id is null or v_prescription_id is null then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'session_not_in_prescription');
  end if;

  v_completed := coalesce((p_execution->>'completed')::boolean, false);
  v_duration := (p_execution->>'duration_seconds')::integer;
  v_distance := (p_execution->>'distance_km')::numeric;
  v_rpe := (p_execution->>'rpe')::integer;
  v_pain := (p_execution->>'pain')::integer;
  v_fatigue := (p_execution->>'fatigue')::integer;
  v_difficulty := p_execution->>'difficulty';
  v_recovery := p_execution->>'recovery';
  if v_duration is null or v_duration not between 0 and 86400
     or v_distance is null or v_distance not between 0 and 100
     or v_rpe is null or v_rpe not between 0 and 10
     or v_pain is null or v_pain not between 0 and 10
     or v_fatigue is null or v_fatigue not between 0 and 10
     or v_difficulty is null or v_difficulty not in ('easy', 'moderate', 'hard')
     or v_recovery is null or v_recovery not in ('good', 'partial', 'poor')
     or (v_completed and (v_duration <= 0 or v_distance <= 0)) then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_execution');
  end if;

  if coalesce((p_execution->>'concerning_symptoms')::boolean, false) or v_pain >= 4
     or coalesce((p_execution->>'injury_during_run')::boolean, false) then
    v_action := 'professional_review';
    v_reason := 'Sintoma relevante, lesão ou dor alta; interromper e solicitar avaliação profissional.';
  elsif not v_completed then
    v_action := 'repeat';
    v_reason := 'Sessão não concluída; revisar o motivo e repetir o estágio.';
  elsif v_pain > 0 then
    v_action := 'maintain';
    v_reason := 'Dor relatada; sem progressão automática.';
  elsif v_fatigue >= 8 or v_recovery = 'poor' or v_rpe >= 9 then
    v_action := 'reduce';
    v_reason := 'Fadiga alta, recuperação insuficiente ou esforço muito alto.';
  elsif v_difficulty = 'hard' or v_rpe >= 8 or v_recovery = 'partial' then
    v_action := 'maintain';
    v_reason := 'Esforço alto ou recuperação parcial; manter o estágio.';
  else
    select count(*) into v_prior_tolerated from (
      select e.id from public.hag_run_executions as e
      where e.patient_id = v_patient_id
      order by e.recorded_at desc, e.id desc limit 1
    ) as prior
    join public.hag_run_executions as pe on pe.id = prior.id
    where pe.completed and pe.pain = 0 and pe.rpe <= 6 and pe.fatigue < 8 and pe.recovery = 'good';
    if v_prior_tolerated >= 1 and v_rpe <= 6 and v_fatigue < 8 and v_recovery = 'good' then
      v_action := 'progress';
      v_reason := 'Duas sessões consecutivas foram concluídas com boa tolerância.';
    else
      v_action := 'repeat';
      v_reason := 'Aguardar outra sessão bem tolerada antes de progredir.';
    end if;
  end if;
  v_recommendation := pg_catalog.jsonb_build_object('action', v_action,
    'progressAllowed', v_action = 'progress', 'reason', v_reason);

  insert into public.hag_run_executions(
    patient_id, program_id, prescription_id, session_id, client_event_id,
    completed, duration_seconds, distance_km, rpe, difficulty, pain, fatigue,
    recovery, concerning_symptoms, injury_during_run, recommendation, details
  ) values (
    v_patient_id, v_program_id, v_prescription_id, p_session_id, p_client_event_id,
    v_completed, v_duration, v_distance, v_rpe, v_difficulty, v_pain, v_fatigue,
    v_recovery, coalesce((p_execution->>'concerning_symptoms')::boolean, false),
    coalesce((p_execution->>'injury_during_run')::boolean, false),
    v_recommendation,
    case when pg_catalog.jsonb_typeof(p_execution->'details') = 'object' then p_execution->'details' else '{}'::jsonb end
  ) on conflict (patient_id, client_event_id) do nothing
  returning id into v_execution_id;
  if v_execution_id is null then
    v_duplicate := true;
    select e.id, e.recommendation into v_execution_id, v_existing_recommendation from public.hag_run_executions as e
      where e.patient_id = v_patient_id and e.client_event_id = p_client_event_id;
    v_recommendation := coalesce(v_existing_recommendation, v_recommendation);
  end if;
  if not v_duplicate then
    update public.hag_run_programs as p set
      progression_state = pg_catalog.jsonb_build_object(
        'current_week', coalesce((p.progression_state->>'current_week')::integer,
          (select (rx.plan->>'week')::integer from public.hag_run_prescriptions as rx where rx.id = v_prescription_id and rx.patient_id = v_patient_id)),
        'last_recommendation', v_recommendation,
        'last_execution_id', v_execution_id
      ),
      updated_at = pg_catalog.now()
    where p.id = v_program_id and p.patient_id = v_patient_id;
  end if;
  return pg_catalog.jsonb_build_object('ok', true, 'execution_id', v_execution_id,
    'duplicate', v_duplicate, 'recommendation', v_recommendation);
end;
$$;

-- Funções privilegiadas não ficam no schema exposto pela Data API. Os wrappers
-- públicos são invoker e só delegam ao código interno depois do grant mínimo.
revoke all on function hag_run_private.patient_context_impl(text) from public, authenticated;
revoke all on function hag_run_private.patient_save_assessment_impl(text, jsonb, jsonb, jsonb, jsonb) from public, authenticated;
revoke all on function hag_run_private.patient_save_execution_impl(text, uuid, text, jsonb) from public, authenticated;
grant execute on function hag_run_private.patient_context_impl(text) to anon;
grant execute on function hag_run_private.patient_save_assessment_impl(text, jsonb, jsonb, jsonb, jsonb) to anon;
grant execute on function hag_run_private.patient_save_execution_impl(text, uuid, text, jsonb) to anon;

create or replace function public.hag_run_patient_context(p_token text)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select hag_run_private.patient_context_impl($1); $$;
create or replace function public.hag_run_patient_save_assessment(
  p_token text, p_assessment jsonb, p_profile jsonb, p_program jsonb, p_prescription jsonb
)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select hag_run_private.patient_save_assessment_impl($1, $2, $3, $4, $5); $$;
create or replace function public.hag_run_patient_save_execution(
  p_token text, p_client_event_id uuid, p_session_id text, p_execution jsonb
)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select hag_run_private.patient_save_execution_impl($1, $2, $3, $4); $$;

revoke all on function public.hag_run_patient_context(text) from public, authenticated;
revoke all on function public.hag_run_patient_save_assessment(text, jsonb, jsonb, jsonb, jsonb) from public, authenticated;
revoke all on function public.hag_run_patient_save_execution(text, uuid, text, jsonb) from public, authenticated;
grant execute on function public.hag_run_patient_context(text) to anon;
grant execute on function public.hag_run_patient_save_assessment(text, jsonb, jsonb, jsonb, jsonb) to anon;
grant execute on function public.hag_run_patient_save_execution(text, uuid, text, jsonb) to anon;

commit;
