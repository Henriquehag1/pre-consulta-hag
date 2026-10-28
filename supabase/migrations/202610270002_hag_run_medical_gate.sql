-- Gate HAG RUN behind patient-submitted triage and authenticated clinician review.
-- Additive only. Do not apply to production without a separate reviewed rollout.
begin;

create table if not exists public.hag_run_assessment_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  assessment jsonb not null check (jsonb_typeof(assessment) = 'object'),
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  triage jsonb not null check (jsonb_typeof(triage) = 'object'),
  status text not null default 'pending' check (status in ('pending','reviewed','withdrawn')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (id, patient_id)
);

create table if not exists public.hag_run_clinician_patient_access (
  clinician_user_id uuid not null,
  patient_id text not null references public.patients(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (clinician_user_id, patient_id)
);

create table if not exists public.hag_run_patient_holds (
  patient_id text primary key references public.patients(id) on delete cascade,
  request_id uuid references public.hag_run_assessment_requests(id),
  created_at timestamptz not null default now(),
  cleared_at timestamptz
);

create table if not exists public.hag_run_medical_authorizations (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  request_id uuid references public.hag_run_assessment_requests(id),
  prescription_id uuid references public.hag_run_prescriptions(id),
  clinician_user_id uuid not null,
  decision text not null check (decision in ('released','released_with_restrictions','review','suspended')),
  scope jsonb not null check (jsonb_typeof(scope) = 'object'),
  reason text not null check (length(trim(reason)) between 3 and 1000),
  authorized_plan jsonb check (authorized_plan is null or jsonb_typeof(authorized_plan) = 'object'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key (request_id, patient_id)
    references public.hag_run_assessment_requests(id, patient_id)
);

create table if not exists public.hag_run_medical_audit (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null references public.patients(id) on delete cascade,
  clinician_user_id uuid not null,
  authorization_id uuid not null references public.hag_run_medical_authorizations(id),
  decision text not null,
  reason text not null,
  scope jsonb not null,
  plan_fingerprint text,
  created_at timestamptz not null default now()
);

create index if not exists hag_run_requests_patient_created_idx
  on public.hag_run_assessment_requests(patient_id, created_at desc);
create index if not exists hag_run_authorizations_patient_created_idx
  on public.hag_run_medical_authorizations(patient_id, created_at desc);

alter table public.hag_run_assessment_requests enable row level security;
alter table public.hag_run_assessment_requests force row level security;
alter table public.hag_run_clinician_patient_access enable row level security;
alter table public.hag_run_clinician_patient_access force row level security;
alter table public.hag_run_patient_holds enable row level security;
alter table public.hag_run_patient_holds force row level security;
alter table public.hag_run_medical_authorizations enable row level security;
alter table public.hag_run_medical_authorizations force row level security;
alter table public.hag_run_medical_audit enable row level security;
alter table public.hag_run_medical_audit force row level security;
revoke all on public.hag_run_assessment_requests, public.hag_run_clinician_patient_access,
  public.hag_run_patient_holds, public.hag_run_medical_authorizations, public.hag_run_medical_audit from public, anon, authenticated;

create or replace function hag_run_private.patient_context_v2_impl(p_token text)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare v_patient_id text; v_context jsonb; v_authorization jsonb;
begin
  select a.patient_id into v_patient_id from public.treino_acessos a
   where a.token = p_token and a.revogado is false
     and (a.hag_run_expires_at is null or a.hag_run_expires_at > pg_catalog.now());
  if v_patient_id is null then return pg_catalog.jsonb_build_object('ok',false,'error','invalid_link'); end if;
  v_context := hag_run_private.patient_context_impl(p_token);
  select pg_catalog.jsonb_build_object('id',a.id,'decision',a.decision,
      'scope',a.scope,'authorized_plan',a.authorized_plan,'created_at',a.created_at)
    into v_authorization from public.hag_run_medical_authorizations a where a.patient_id=v_patient_id and a.revoked_at is null
      order by a.created_at desc,a.id desc limit 1;
  return pg_catalog.jsonb_build_object(
    'ok',true,
    'program',case when v_authorization->>'decision' in ('released','released_with_restrictions')
      and not exists(select 1 from public.hag_run_patient_holds h where h.patient_id=v_patient_id and h.cleared_at is null)
      then v_context->'program' else 'null'::jsonb end,
    'prescription',case when v_authorization->>'decision' in ('released','released_with_restrictions')
      and not exists(select 1 from public.hag_run_patient_holds h where h.patient_id=v_patient_id and h.cleared_at is null)
      then v_context->'prescription' else 'null'::jsonb end,
    'history',coalesce(v_context->'history','[]'::jsonb),
    'medical_authorization',v_authorization,
    'pending_review', exists(select 1 from public.hag_run_assessment_requests r
      where r.patient_id=v_patient_id and r.status='pending') or exists(select 1 from public.hag_run_patient_holds h
      where h.patient_id=v_patient_id and h.cleared_at is null));
end $$;

create or replace function hag_run_private.patient_submit_assessment_impl(
  p_token text,p_assessment jsonb,p_profile jsonb,p_triage jsonb
) returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare v_patient_id text; v_request_id uuid;
begin
  if p_token is null or length(p_token) not between 32 and 128
     or pg_catalog.jsonb_typeof(p_assessment) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_profile) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_triage) is distinct from 'object'
     or pg_catalog.octet_length(p_assessment::text)>20000
     or pg_catalog.octet_length(p_profile::text)>20000
     or pg_catalog.octet_length(p_triage::text)>10000 then
    return pg_catalog.jsonb_build_object('ok',false,'error','invalid_payload');
  end if;
  select a.patient_id into v_patient_id from public.treino_acessos a
   where a.token=p_token and a.revogado is false
     and (a.hag_run_expires_at is null or a.hag_run_expires_at>pg_catalog.now());
  if v_patient_id is null then return pg_catalog.jsonb_build_object('ok',false,'error','invalid_link'); end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_patient_id));
  select id into v_request_id from public.hag_run_assessment_requests
   where patient_id=v_patient_id and status='pending' order by created_at desc limit 1 for update;
  if v_request_id is null then
    insert into public.hag_run_assessment_requests(patient_id,assessment,profile,triage)
    values(v_patient_id,p_assessment,p_profile,p_triage) returning id into v_request_id;
  else
    update public.hag_run_assessment_requests set assessment=p_assessment,profile=p_profile,triage=p_triage,created_at=pg_catalog.now()
     where id=v_request_id and patient_id=v_patient_id;
  end if;
  insert into public.hag_run_patient_holds(patient_id,request_id,created_at,cleared_at)
    values(v_patient_id,v_request_id,pg_catalog.now(),null)
  on conflict(patient_id) do update set request_id=excluded.request_id,created_at=excluded.created_at,cleared_at=null;
  return pg_catalog.jsonb_build_object('ok',true,'request_id',v_request_id,'status','pending_review');
end $$;

create or replace function public.hag_run_patient_context_v2(p_token text)
returns jsonb language sql security invoker set search_path=pg_catalog
as $$ select hag_run_private.patient_context_v2_impl($1); $$;
create or replace function public.hag_run_patient_submit_assessment(
 p_token text,p_assessment jsonb,p_profile jsonb,p_triage jsonb
) returns jsonb language sql security invoker set search_path=pg_catalog
as $$ select hag_run_private.patient_submit_assessment_impl($1,$2,$3,$4); $$;

create or replace function public.hag_run_clinician_context(p_patient_id text)
returns jsonb language plpgsql security definer set search_path=pg_catalog
as $$
declare v_user uuid; v_request jsonb; v_program jsonb; v_prescription jsonb; v_history jsonb;
begin
  v_user:=auth.uid();
  if v_user is null or not exists(select 1 from public.hag_run_clinician_patient_access a
    where a.clinician_user_id=v_user and a.patient_id=p_patient_id and a.revoked_at is null) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  select pg_catalog.jsonb_build_object('id',r.id,'assessment',r.assessment,'profile',r.profile,
    'triage',r.triage,'status',r.status,'created_at',r.created_at) into v_request
    from public.hag_run_assessment_requests r where r.patient_id=p_patient_id and r.status='pending'
    order by r.created_at desc limit 1;
  select pg_catalog.jsonb_build_object('assessment',p.assessment,'profile',p.profile,
    'progression_state',p.progression_state,'updated_at',p.updated_at) into v_program
    from public.hag_run_programs p where p.patient_id=p_patient_id and p.slug='rumo_5k';
  select pg_catalog.jsonb_build_object('id',rx.id,'engine_version',rx.engine_version,'plan',rx.plan,
    'created_at',rx.created_at) into v_prescription from public.hag_run_prescriptions rx
    where rx.patient_id=p_patient_id order by rx.created_at desc,rx.id desc limit 1;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',e.id,'session_id',e.session_id,
    'completed',e.completed,'duration_seconds',e.duration_seconds,'distance_km',e.distance_km,'rpe',e.rpe,
    'pain',e.pain,'fatigue',e.fatigue,'recovery',e.recovery,'recorded_at',e.recorded_at)
    order by e.recorded_at desc),'[]'::jsonb) into v_history from (
      select * from public.hag_run_executions e where e.patient_id=p_patient_id
      order by e.recorded_at desc,e.id desc limit 200) e;
  return pg_catalog.jsonb_build_object('ok',true,'request',v_request,'program',v_program,
    'prescription',v_prescription,'history',coalesce(v_history,'[]'::jsonb),
    'authorization_history',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id',a.id,'decision',a.decision,'scope',a.scope,'reason',a.reason,'created_at',a.created_at)
      order by a.created_at desc),'[]'::jsonb) from public.hag_run_medical_authorizations a
      where a.patient_id=p_patient_id));
end $$;

create or replace function public.hag_run_clinician_review(
  p_patient_id text,p_decision text,p_scope jsonb,p_plan jsonb,p_reason text
) returns jsonb language plpgsql security definer set search_path=pg_catalog
as $$
declare v_user uuid; v_request public.hag_run_assessment_requests%rowtype; v_auth uuid; v_program uuid;
 v_rx uuid; v_fingerprint text; v_request_id uuid; v_assessment jsonb; v_profile jsonb;
begin
  v_user := auth.uid();
  if v_user is null or p_patient_id is null or not exists(
    select 1 from public.hag_run_clinician_patient_access a where a.clinician_user_id=v_user
      and a.patient_id=p_patient_id and a.revoked_at is null) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_decision is null or p_decision not in ('released','released_with_restrictions','review','suspended')
     or jsonb_typeof(p_scope) is distinct from 'object'
     or pg_catalog.octet_length(p_scope::text)>10000
     or p_reason is null or length(trim(p_reason)) not between 3 and 1000 then
    raise exception 'invalid_review' using errcode='22023';
  end if;
  if p_decision in ('released','released_with_restrictions') and
     (jsonb_typeof(p_plan) is distinct from 'object' or jsonb_typeof(p_plan->'sessions') is distinct from 'array'
      or jsonb_array_length(p_plan->'sessions')=0 or jsonb_array_length(p_plan->'sessions')>7
      or pg_catalog.octet_length(p_plan::text)>100000) then
    raise exception 'authorized_plan_required' using errcode='22023';
  end if;
  if p_decision in ('released','released_with_restrictions')
     and p_scope->>'running_allowed' is distinct from 'true' then
    raise exception 'running_not_in_authorized_scope' using errcode='22023';
  end if;
  if p_decision='released_with_restrictions'
     and length(trim(coalesce(p_scope->>'patient_instructions',''))) not between 3 and 1000 then
    raise exception 'restricted_instructions_required' using errcode='22023';
  end if;
  if p_decision in ('released','released_with_restrictions') and exists(
    select 1 from jsonb_array_elements(p_plan->'sessions') s
    where jsonb_typeof(s) is distinct from 'object'
      or nullif(trim(s->>'id'),'') is null or length(s->>'id')>120
      or jsonb_typeof(s->'segments') is distinct from 'array'
      or jsonb_array_length(s->'segments')=0
      or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(s->'segments')='array' then s->'segments' else '[]'::jsonb end) seg
        where jsonb_typeof(seg) is distinct from 'object'
          or (seg->>'seconds') is null or (seg->>'seconds') !~ '^[0-9]+$'
          or (seg->>'seconds')::numeric not between 1 and 86400
          or coalesce((seg->>'rpeTarget')::numeric not between 0 and 10,true)
          or seg->>'type' not in ('warmup_walk','run','walk','cooldown_walk'))
  ) then raise exception 'invalid_plan_structure' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_patient_id));
  select * into v_request from public.hag_run_assessment_requests r where r.patient_id=p_patient_id
    and r.status='pending' order by r.created_at desc limit 1 for update;
  if found then
    v_request_id:=v_request.id; v_assessment:=v_request.assessment; v_profile:=v_request.profile;
    if p_decision in ('released','released_with_restrictions') and
       (v_request.triage->>'emergency_active'='true' or v_request.triage->>'state'='URGÊNCIA') then
      raise exception 'active_urgent_symptom_requires_resolution' using errcode='22023';
    end if;
  else
    select p.id,p.assessment,p.profile into v_program,v_assessment,v_profile from public.hag_run_programs p
      where p.patient_id=p_patient_id and p.slug='rumo_5k' for update;
    if not found then raise exception 'review_context_not_found' using errcode='P0002'; end if;
    select rx.id into v_rx from public.hag_run_prescriptions rx where rx.patient_id=p_patient_id
      and rx.program_id=v_program order by rx.created_at desc,rx.id desc limit 1;
  end if;
  if p_decision in ('released','released_with_restrictions') and (
      coalesce(v_profile->'inputs'->>'ageYears','') !~ '^[0-9]+$'
      or (v_profile->'inputs'->>'ageYears')::integer < 18) then
    raise exception 'adult_population_required' using errcode='22023';
  end if;
  if p_decision in ('released','released_with_restrictions') then
    insert into public.hag_run_programs(patient_id,slug,selected_program,assessment,profile,progression_state)
    values(p_patient_id,'rumo_5k',pg_catalog.jsonb_build_object('slug','rumo_5k','goal','5k'),v_assessment,v_profile,
      pg_catalog.jsonb_build_object('current_week',coalesce((p_plan->>'week')::integer,1),'decision_reason','clinician_authorized'))
    on conflict(patient_id,slug) do update set assessment=excluded.assessment,profile=excluded.profile,
      progression_state=excluded.progression_state,updated_at=pg_catalog.now()
    returning id into v_program;
    v_fingerprint:=pg_catalog.md5(p_plan::text);
    insert into public.hag_run_prescriptions(patient_id,program_id,engine_version,plan,plan_fingerprint,created_at)
      values(p_patient_id,v_program,'clinician-authored-v1',p_plan,v_fingerprint,pg_catalog.clock_timestamp())
      on conflict(patient_id,program_id,plan_fingerprint) do update set plan=excluded.plan returning id into v_rx;
  end if;
  insert into public.hag_run_medical_authorizations(patient_id,request_id,prescription_id,clinician_user_id,
    decision,scope,reason,authorized_plan,created_at)
  values(p_patient_id,v_request_id,v_rx,v_user,p_decision,p_scope,trim(p_reason),
    case when p_decision in ('released','released_with_restrictions') then p_plan else null end,pg_catalog.clock_timestamp())
  returning id into v_auth;
  if v_request_id is not null then
    update public.hag_run_assessment_requests set status='reviewed',reviewed_at=pg_catalog.now()
     where id=v_request_id and patient_id=p_patient_id;
  end if;
  insert into public.hag_run_medical_audit(patient_id,clinician_user_id,authorization_id,decision,reason,scope,plan_fingerprint)
  values(p_patient_id,v_user,v_auth,p_decision,trim(p_reason),p_scope,v_fingerprint);
  if p_decision in ('released','released_with_restrictions') then
    update public.hag_run_patient_holds set cleared_at=pg_catalog.now()
      where patient_id=p_patient_id and cleared_at is null;
  end if;
  return pg_catalog.jsonb_build_object('ok',true,'authorization_id',v_auth,'prescription_id',v_rx,'decision',p_decision);
end $$;

create or replace function hag_run_private.hold_unapproved_automation()
returns trigger language plpgsql security definer set search_path=pg_catalog
as $$
declare v_request_id uuid; v_assessment jsonb; v_profile jsonb;
begin
  if tg_table_name='hag_run_executions' then
    if not exists(select 1 from public.hag_run_medical_authorizations a
      where a.patient_id=new.patient_id and a.prescription_id=new.prescription_id and a.revoked_at is null
        and a.decision in ('released','released_with_restrictions')
        and a.id=(select latest.id from public.hag_run_medical_authorizations latest
          where latest.patient_id=new.patient_id and latest.revoked_at is null order by latest.created_at desc,latest.id desc limit 1))
      or exists(select 1 from public.hag_run_patient_holds h where h.patient_id=new.patient_id and h.cleared_at is null) then
      raise exception 'medical_authorization_required' using errcode='42501';
    end if;
    new.recommendation:=pg_catalog.jsonb_build_object(
      'action',case when new.concerning_symptoms or new.injury_during_run or new.pain>0
        then 'professional_review' else 'maintain' end,
      'progressAllowed',false,
      'reason',case when new.concerning_symptoms or new.injury_during_run or new.pain>0
        then 'Dor, sintoma ou lesão requer avaliação profissional.'
        else 'A mudança de dose aguarda avaliação do ciclo completo e autorização clínica.' end);
    if new.concerning_symptoms or new.injury_during_run or new.pain>0 then
      select id into v_request_id from public.hag_run_assessment_requests
        where patient_id=new.patient_id and status='pending' order by created_at desc limit 1 for update;
      if v_request_id is null then
        select assessment,profile into v_assessment,v_profile from public.hag_run_programs
          where id=new.program_id and patient_id=new.patient_id;
        insert into public.hag_run_assessment_requests(patient_id,assessment,profile,triage)
          values(new.patient_id,coalesce(v_assessment,'{}'::jsonb),coalesce(v_profile,'{}'::jsonb),
            pg_catalog.jsonb_build_object('state','AMARELO','source','session_report','execution_id',new.id,
              'pain',new.pain,'concerning_symptoms',new.concerning_symptoms,'injury_during_run',new.injury_during_run))
          returning id into v_request_id;
      else
        update public.hag_run_assessment_requests set triage=triage||pg_catalog.jsonb_build_object(
          'source','session_report','execution_id',new.id,'pain',new.pain,
          'concerning_symptoms',new.concerning_symptoms,'injury_during_run',new.injury_during_run),created_at=pg_catalog.now()
          where id=v_request_id and patient_id=new.patient_id;
      end if;
      insert into public.hag_run_patient_holds(patient_id,request_id,created_at,cleared_at)
        values(new.patient_id,v_request_id,pg_catalog.now(),null)
      on conflict(patient_id) do update set request_id=excluded.request_id,created_at=excluded.created_at,cleared_at=null;
    end if;
  elsif new.progression_state ? 'last_recommendation' then
    new.progression_state:=pg_catalog.jsonb_set(new.progression_state,'{last_recommendation}',
      pg_catalog.jsonb_build_object('action','maintain','progressAllowed',false,
        'reason','A dose não muda automaticamente; aguarda decisão clínica individual.'));
    if old.progression_state ? 'current_week' then
      new.progression_state:=pg_catalog.jsonb_set(new.progression_state,'{current_week}',old.progression_state->'current_week');
    end if;
  end if;
  return new;
end $$;
revoke all on function hag_run_private.hold_unapproved_automation() from public,anon,authenticated;
drop trigger if exists hag_run_execution_hold_automation on public.hag_run_executions;
create trigger hag_run_execution_hold_automation before insert or update of recommendation
  on public.hag_run_executions for each row execute function hag_run_private.hold_unapproved_automation();
drop trigger if exists hag_run_program_hold_automation on public.hag_run_programs;
create trigger hag_run_program_hold_automation before update of progression_state
  on public.hag_run_programs for each row execute function hag_run_private.hold_unapproved_automation();

revoke all on function hag_run_private.patient_context_v2_impl(text) from public,authenticated;
revoke all on function hag_run_private.patient_submit_assessment_impl(text,jsonb,jsonb,jsonb) from public,authenticated;
grant execute on function hag_run_private.patient_context_v2_impl(text) to anon;
grant execute on function hag_run_private.patient_submit_assessment_impl(text,jsonb,jsonb,jsonb) to anon;
revoke all on function public.hag_run_patient_context_v2(text) from public,authenticated;
grant execute on function public.hag_run_patient_context_v2(text) to anon;
grant execute on function public.hag_run_patient_submit_assessment(text,jsonb,jsonb,jsonb) to anon;
revoke all on function public.hag_run_patient_context_v2(text) from public,authenticated;
revoke all on function public.hag_run_patient_submit_assessment(text,jsonb,jsonb,jsonb) from public,authenticated;
revoke all on function public.hag_run_patient_save_assessment(text,jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function hag_run_private.patient_save_assessment_impl(text,jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.hag_run_patient_context(text) from public,anon,authenticated;
revoke all on function hag_run_private.patient_context_impl(text) from public,anon,authenticated;
revoke all on function public.hag_run_clinician_review(text,text,jsonb,jsonb,text) from public,anon;
grant execute on function public.hag_run_clinician_review(text,text,jsonb,jsonb,text) to authenticated;
revoke all on function public.hag_run_clinician_context(text) from public,anon;
grant execute on function public.hag_run_clinician_context(text) to authenticated;

notify pgrst, 'reload schema';
commit;
