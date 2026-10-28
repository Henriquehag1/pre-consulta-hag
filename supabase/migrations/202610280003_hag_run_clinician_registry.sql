-- HAG_RUN_CLINICIAN_REGISTRY_v1 (28/10/2026)
-- Integracao do HAG RUN ao HAG OS real. O HAG OS nao tem papeis de equipe: todo login (medico e
-- secretaria) entra como `authenticated`. O gate medico da 0002 confiava em
-- hag_run_clinician_patient_access, mas nao havia processo para criar esse vinculo (o host de
-- desenvolvimento inseria direto no banco). Esta migracao cria:
--   1. hag_run_clinicians: cadastro de quem pode revisar e prescrever corrida. So o dono do banco
--      cadastra (funcao privada sem grant para as roles da API). E o processo administrativo.
--   2. vinculo medico-paciente feito pelo proprio medico cadastrado, com motivo e auditoria.
--   3. desativar um medico revoga todos os vinculos dele na mesma transacao.
-- Nenhuma funcao da 0002 foi redefinida: as RPCs clinicas continuam exigindo vinculo ativo, e agora
-- vinculo ativo so nasce de medico cadastrado e ativo.
-- Aditiva. Nao aplicar em producao sem etapa de homologacao e autorizacao de publicacao.
begin;

create table if not exists public.hag_run_clinicians (
  user_id uuid primary key,
  role text not null default 'medico' check (role in ('medico')),
  display_name text not null check (length(trim(display_name)) between 3 and 120),
  council_id text check (council_id is null or length(trim(council_id)) between 3 and 40),
  active boolean not null default true,
  registered_at timestamptz not null default now(),
  registered_by text not null check (length(trim(registered_by)) between 3 and 120),
  deactivated_at timestamptz
);

create table if not exists public.hag_run_access_audit (
  id uuid primary key default gen_random_uuid(),
  clinician_user_id uuid not null,
  patient_id text references public.patients(id) on delete cascade,
  action text not null check (action in ('clinician_registered','clinician_deactivated','link','unlink')),
  reason text not null check (length(trim(reason)) between 3 and 500),
  actor text not null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists hag_run_access_audit_patient_idx on public.hag_run_access_audit(patient_id, created_at desc);

alter table public.hag_run_clinicians enable row level security;
alter table public.hag_run_clinicians force row level security;
alter table public.hag_run_access_audit enable row level security;
alter table public.hag_run_access_audit force row level security;
revoke all on public.hag_run_clinicians, public.hag_run_access_audit from public, anon, authenticated;

-- 1. Cadastro: so o dono do banco (migracao ou SQL administrativo). Sem grant para anon/authenticated.
create or replace function hag_run_private.register_clinician(
  p_user_id uuid, p_display_name text, p_council_id text, p_registered_by text
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if p_user_id is null or p_registered_by is null or length(trim(p_registered_by)) < 3 then
    raise exception 'invalid_registration' using errcode = '22023';
  end if;
  insert into public.hag_run_clinicians(user_id, role, display_name, council_id, active, registered_by)
  values (p_user_id, 'medico', trim(p_display_name), nullif(trim(coalesce(p_council_id,'')), ''), true, trim(p_registered_by))
  on conflict (user_id) do update set display_name = excluded.display_name, council_id = excluded.council_id,
    active = true, deactivated_at = null, registered_by = excluded.registered_by;
  insert into public.hag_run_access_audit(clinician_user_id, patient_id, action, reason, actor)
  values (p_user_id, null, 'clinician_registered', 'Cadastro administrativo de medico do HAG RUN', trim(p_registered_by));
  return pg_catalog.jsonb_build_object('ok', true, 'user_id', p_user_id);
end $$;

create or replace function hag_run_private.deactivate_clinician(p_user_id uuid, p_reason text, p_actor text)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare v_n integer;
begin
  if p_reason is null or length(trim(p_reason)) < 3 or p_actor is null or length(trim(p_actor)) < 3 then
    raise exception 'invalid_deactivation' using errcode = '22023';
  end if;
  update public.hag_run_clinicians set active = false, deactivated_at = pg_catalog.now()
   where user_id = p_user_id and active;
  if not found then raise exception 'clinician_not_active' using errcode = 'P0002'; end if;
  update public.hag_run_clinician_patient_access set revoked_at = pg_catalog.now()
   where clinician_user_id = p_user_id and revoked_at is null;
  get diagnostics v_n = row_count;
  insert into public.hag_run_access_audit(clinician_user_id, patient_id, action, reason, actor)
  values (p_user_id, null, 'clinician_deactivated', trim(p_reason), trim(p_actor));
  return pg_catalog.jsonb_build_object('ok', true, 'links_revoked', v_n);
end $$;

revoke all on function hag_run_private.register_clinician(uuid, text, text, text) from public, anon, authenticated;
revoke all on function hag_run_private.deactivate_clinician(uuid, text, text) from public, anon, authenticated;

-- 2. Quem esta logado: o painel usa para mostrar (ou nao) as acoes medicas. Nao revela outros usuarios.
create or replace function public.hag_run_clinician_me()
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $$
declare v_user uuid := auth.uid(); v_row public.hag_run_clinicians%rowtype;
begin
  if v_user is null then return pg_catalog.jsonb_build_object('ok', false, 'error', 'authenticated_session_required'); end if;
  select * into v_row from public.hag_run_clinicians c where c.user_id = v_user and c.active;
  return pg_catalog.jsonb_build_object('ok', true, 'registered', found,
    'role', case when found then v_row.role end, 'display_name', case when found then v_row.display_name end);
end $$;

-- 3. Vinculo e desvinculo pelo proprio medico cadastrado, com motivo e auditoria.
create or replace function public.hag_run_clinician_link_patient(p_patient_id text, p_reason text)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not exists (select 1 from public.hag_run_clinicians c where c.user_id = v_user and c.active and c.role = 'medico') then
    raise exception 'registered_clinician_required' using errcode = '42501';
  end if;
  if p_patient_id is null or length(p_patient_id) > 120 or p_reason is null or length(trim(p_reason)) not between 3 and 500 then
    raise exception 'invalid_link_request' using errcode = '22023';
  end if;
  if not exists (select 1 from public.patients p where p.id = p_patient_id) then
    raise exception 'patient_not_found' using errcode = 'P0002';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('hag_run_link:' || p_patient_id));
  if exists (select 1 from public.hag_run_clinician_patient_access a
             where a.clinician_user_id = v_user and a.patient_id = p_patient_id and a.revoked_at is null) then
    return pg_catalog.jsonb_build_object('ok', true, 'already_linked', true);
  end if;
  insert into public.hag_run_clinician_patient_access(clinician_user_id, patient_id, granted_at, revoked_at)
  values (v_user, p_patient_id, pg_catalog.now(), null)
  on conflict (clinician_user_id, patient_id) do update set granted_at = pg_catalog.now(), revoked_at = null;
  insert into public.hag_run_access_audit(clinician_user_id, patient_id, action, reason, actor)
  values (v_user, p_patient_id, 'link', trim(p_reason), v_user::text);
  return pg_catalog.jsonb_build_object('ok', true, 'already_linked', false);
end $$;

create or replace function public.hag_run_clinician_unlink_patient(p_patient_id text, p_reason text)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not exists (select 1 from public.hag_run_clinicians c where c.user_id = v_user and c.active) then
    raise exception 'registered_clinician_required' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) not between 3 and 500 then
    raise exception 'invalid_link_request' using errcode = '22023';
  end if;
  update public.hag_run_clinician_patient_access set revoked_at = pg_catalog.now()
   where clinician_user_id = v_user and patient_id = p_patient_id and revoked_at is null;
  if not found then return pg_catalog.jsonb_build_object('ok', true, 'was_linked', false); end if;
  insert into public.hag_run_access_audit(clinician_user_id, patient_id, action, reason, actor)
  values (v_user, p_patient_id, 'unlink', trim(p_reason), v_user::text);
  return pg_catalog.jsonb_build_object('ok', true, 'was_linked', true);
end $$;

-- 4. Vinculo so vale para medico cadastrado e ativo, mesmo que alguem com acesso de dono insira direto
--    na tabela: o gatilho recusa vinculo novo ou reativado de quem nao esta cadastrado.
create or replace function hag_run_private.require_registered_clinician()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if new.revoked_at is null and not exists (select 1 from public.hag_run_clinicians c
       where c.user_id = new.clinician_user_id and c.active and c.role = 'medico') then
    raise exception 'registered_clinician_required' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function hag_run_private.require_registered_clinician() from public, anon, authenticated;
-- Vinculos anteriores a esta migracao, de quem nao esta cadastrado, deixam de valer (fail-closed).
update public.hag_run_clinician_patient_access a set revoked_at = pg_catalog.now()
 where a.revoked_at is null and not exists (select 1 from public.hag_run_clinicians c
   where c.user_id = a.clinician_user_id and c.active and c.role = 'medico');
drop trigger if exists hag_run_access_requires_clinician on public.hag_run_clinician_patient_access;
create trigger hag_run_access_requires_clinician before insert or update on public.hag_run_clinician_patient_access
  for each row execute function hag_run_private.require_registered_clinician();

revoke all on function public.hag_run_clinician_me() from public, anon;
revoke all on function public.hag_run_clinician_link_patient(text, text) from public, anon;
revoke all on function public.hag_run_clinician_unlink_patient(text, text) from public, anon;
grant execute on function public.hag_run_clinician_me() to authenticated;
grant execute on function public.hag_run_clinician_link_patient(text, text) to authenticated;
grant execute on function public.hag_run_clinician_unlink_patient(text, text) to authenticated;

commit;
