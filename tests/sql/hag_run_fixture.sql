-- Synthetic-only prerequisite schema for the HAG RUN migration tests.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;

do $$ begin
  if to_regnamespace('auth') is null then execute 'create schema auth'; end if;
  if to_regprocedure('auth.uid()') is null then execute $fn$
    create function auth.uid() returns uuid language sql stable as
      'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid'
  $fn$; end if;
exception when insufficient_privilege then null;
end $$;

create table public.patients (
  id text primary key
);

create table public.treino_acessos (
  token text primary key,
  patient_id text not null references public.patients(id),
  revogado boolean not null default false
);

insert into public.patients(id) values ('synthetic-patient-a'), ('synthetic-patient-b'), ('synthetic-patient-c');
insert into public.treino_acessos(token, patient_id, revogado) values
  (repeat('a', 48), 'synthetic-patient-a', false),
  (repeat('b', 48), 'synthetic-patient-b', false),
  (repeat('c', 48), 'synthetic-patient-a', true),
  (repeat('d', 48), 'synthetic-patient-a', false),
  (repeat('e', 48), 'synthetic-patient-c', false);

alter table public.treino_acessos add column hag_run_expires_at timestamptz;
update public.treino_acessos set hag_run_expires_at = now() - interval '1 day' where token = repeat('d', 48);

-- Keep the synthetic legacy tables inaccessible to API roles in this fixture.
revoke all on public.patients, public.treino_acessos from public, anon, authenticated;
alter table public.patients enable row level security;
alter table public.patients force row level security;
alter table public.treino_acessos enable row level security;
alter table public.treino_acessos force row level security;
