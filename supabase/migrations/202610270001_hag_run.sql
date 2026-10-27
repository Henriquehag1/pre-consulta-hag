-- HAG RUN isolated storage. Additive only: existing HAG Treino tables and history are untouched.
begin;

create table if not exists public.hag_run_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug text not null check (slug in ('rumo_5k')),
  title text not null check (length(title) between 1 and 120),
  goal text not null check (goal in ('5k', 'improve_5k')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, slug)
);

create table if not exists public.hag_run_prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id uuid not null,
  engine_version text not null check (length(engine_version) between 1 and 40),
  assessment jsonb not null check (jsonb_typeof(assessment) = 'object'),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (program_id, user_id) references public.hag_run_programs(id, user_id) on delete cascade
);

create table if not exists public.hag_run_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  prescription_id uuid not null,
  session_id text not null check (length(session_id) between 1 and 120),
  completed boolean not null,
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  distance_km numeric(7,3) not null check (distance_km between 0 and 100),
  rpe integer not null check (rpe between 0 and 10),
  difficulty text not null check (difficulty in ('easy', 'moderate', 'hard')),
  pain integer not null check (pain between 0 and 10),
  fatigue integer not null check (fatigue between 0 and 10),
  recovery text not null check (recovery in ('good', 'partial', 'poor')),
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  recorded_at timestamptz not null default now(),
  check (not completed or (duration_seconds > 0 and distance_km > 0)),
  unique (id, user_id),
  foreign key (prescription_id, user_id) references public.hag_run_prescriptions(id, user_id) on delete cascade
);

create index if not exists hag_run_prescriptions_user_created_idx
  on public.hag_run_prescriptions(user_id, created_at desc);
create index if not exists hag_run_executions_user_recorded_idx
  on public.hag_run_executions(user_id, recorded_at desc);
create index if not exists hag_run_executions_prescription_idx
  on public.hag_run_executions(prescription_id, recorded_at desc);

alter table public.hag_run_programs enable row level security;
alter table public.hag_run_prescriptions enable row level security;
alter table public.hag_run_executions enable row level security;
alter table public.hag_run_programs force row level security;
alter table public.hag_run_prescriptions force row level security;
alter table public.hag_run_executions force row level security;

drop policy if exists hag_run_programs_owner on public.hag_run_programs;
create policy hag_run_programs_owner on public.hag_run_programs
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists hag_run_prescriptions_owner on public.hag_run_prescriptions;
create policy hag_run_prescriptions_owner on public.hag_run_prescriptions
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists hag_run_executions_owner on public.hag_run_executions;
create policy hag_run_executions_owner on public.hag_run_executions
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.hag_run_programs, public.hag_run_prescriptions, public.hag_run_executions from anon, public;
grant select, insert, update on public.hag_run_programs to authenticated;
grant select, insert on public.hag_run_prescriptions, public.hag_run_executions to authenticated;

-- One authenticated RPC keeps the program, immutable prescription, and execution atomic.
create or replace function public.hag_run_save(p_program jsonb, p_prescription jsonb, p_execution jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_program_id uuid;
  v_prescription_id uuid;
  v_execution_id uuid;
begin
  insert into public.hag_run_programs (slug, title, goal)
  values (p_program->>'slug', p_program->>'title', p_program->>'goal')
  on conflict (user_id, slug) do update
    set title = excluded.title, goal = excluded.goal, updated_at = now()
  returning id into v_program_id;

  insert into public.hag_run_prescriptions (program_id, engine_version, assessment, plan)
  values (v_program_id, p_prescription->>'engine_version', p_prescription->'assessment', p_prescription->'plan')
  returning id into v_prescription_id;

  insert into public.hag_run_executions (
    prescription_id, session_id, completed, duration_seconds, distance_km,
    rpe, difficulty, pain, fatigue, recovery, details
  ) values (
    v_prescription_id, p_execution->>'session_id', (p_execution->>'completed')::boolean,
    (p_execution->>'duration_seconds')::integer, (p_execution->>'distance_km')::numeric,
    (p_execution->>'rpe')::integer, p_execution->>'difficulty', (p_execution->>'pain')::integer,
    (p_execution->>'fatigue')::integer, p_execution->>'recovery', p_execution->'details'
  ) returning id into v_execution_id;

  return jsonb_build_object(
    'program_id', v_program_id,
    'prescription_id', v_prescription_id,
    'execution_id', v_execution_id
  );
end;
$$;

revoke all on function public.hag_run_save(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.hag_run_save(jsonb, jsonb, jsonb) to authenticated;

commit;
