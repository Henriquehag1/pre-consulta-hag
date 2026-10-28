\set ON_ERROR_STOP on

-- Run after the legacy migration/security checks. All patients and clinician ids are synthetic.
set role anon;
select public.hag_run_patient_submit_assessment(repeat('a',48),
  '{"assessmentDate":"2026-10-27"}'::jsonb,
  '{"inputs":{"maxContinuousMinutes":0,"ageYears":35}}'::jsonb,
  '{"state":"VERDE"}'::jsonb) as submitted_a \gset
select public.hag_run_patient_submit_assessment(repeat('b',48),
  '{"assessmentDate":"2026-10-27"}'::jsonb,
  '{"inputs":{"maxContinuousMinutes":20,"ageYears":35}}'::jsonb,
  '{"state":"URGÊNCIA","emergency_active":true}'::jsonb) as submitted_b \gset
do $$
declare a jsonb; b jsonb;
begin
  a:=public.hag_run_patient_context_v2(repeat('a',48));
  b:=public.hag_run_patient_context_v2(repeat('b',48));
  if a->>'pending_review'<>'true' or a->'program'<>'null'::jsonb then raise exception 'patient A intake should wait for medical authorization: %',a; end if;
  if b->>'pending_review'<>'true' or b->'medical_authorization'<>'null'::jsonb then raise exception 'patient B context should remain isolated: %',b; end if;
  if public.hag_run_patient_submit_assessment(repeat('x',48),'{}','{}','{}')->>'error'<>'invalid_link' then raise exception 'invalid link submitted intake'; end if;
end $$;
reset role;

insert into public.hag_run_clinician_patient_access(clinician_user_id,patient_id)
values('11111111-1111-4111-8111-111111111111','synthetic-patient-a'),
      ('11111111-1111-4111-8111-111111111111','synthetic-patient-b');

set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
set role authenticated;
do $$
begin
  begin perform public.hag_run_clinician_context('synthetic-patient-a');
    raise exception 'unauthorized clinician read was accepted';
  exception when insufficient_privilege then null; end;
  begin perform public.hag_run_clinician_review('synthetic-patient-a','released',
    '{"running_allowed":true}'::jsonb,
    '{"week":1,"sessions":[{"id":"not-allowed"}]}'::jsonb,'Unauthorized');
    raise exception 'unauthorized clinician write was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set role authenticated;
do $$
declare ctx jsonb; result jsonb;
begin
  ctx:=public.hag_run_clinician_context('synthetic-patient-a');
  if ctx->'request' is null or ctx->'request'='null'::jsonb then raise exception 'authorized clinician did not see patient A request'; end if;
  begin perform public.hag_run_clinician_context('synthetic-patient-c');
    raise exception 'changing patient id bypassed clinician scope';
  exception when insufficient_privilege then null; end;
  begin
    perform public.hag_run_clinician_review('synthetic-patient-a','released',
      '{"running_allowed":false,"adaptation_allowed":false}'::jsonb,
      '{"week":1,"sessions":[{"id":"out-of-scope","segments":[{"type":"run","seconds":60,"rpeTarget":3}]}]}'::jsonb,
      'Teste sintético fora do escopo');
    raise exception 'plan outside running scope was accepted';
  exception when invalid_parameter_value then null; end;
  result:=public.hag_run_clinician_review('synthetic-patient-a','released',
    '{"running_allowed":true,"adaptation_allowed":false,"scope_version":"1"}'::jsonb,
    '{"week":1,"sessions":[{"id":"clinician-session-a","title":"Plano sintético","segments":[{"type":"run","seconds":60,"rpeTarget":3}]}]}'::jsonb,
    'Autorização individual sintética');
  if result->>'ok'<>'true' or result->>'prescription_id' is null then raise exception 'clinician release failed: %',result; end if;
  begin
    perform public.hag_run_clinician_review('synthetic-patient-a','released_with_restrictions',
      '{"running_allowed":true,"adaptation_allowed":false}'::jsonb,
      '{"week":2,"sessions":[{"id":"missing-instructions","segments":[{"type":"run","seconds":60,"rpeTarget":3}]}]}'::jsonb,
      'Teste sintético sem orientação ao paciente');
    raise exception 'restricted plan without patient instructions was accepted';
  exception when invalid_parameter_value then null; end;
  result:=public.hag_run_clinician_review('synthetic-patient-a','released_with_restrictions',
    '{"running_allowed":true,"adaptation_allowed":false,"scope_version":"2","patient_instructions":"Siga as restrições registradas pelo médico."}'::jsonb,
    '{"engineVersion":"synthetic-e2e-v1","status":"ready","week":2,"classification":{"level":"R0","reviewReasons":[]},"sessions":[{"id":"clinician-session-next","day":"mon","title":"Sessão sintética de homologação","level":"R0","objective":"Fluxo local de teste.","modality":"road","durationSeconds":120,"durationMinutes":2,"segments":[{"type":"walk","seconds":120,"rpeTarget":2}]}]}'::jsonb,
    'Ajuste individual após revisão do ciclo sintético');
  if result->>'ok'<>'true' or result->>'prescription_id' is null then raise exception 'no-pending-cycle adjustment failed: %',result; end if;
  begin
    perform public.hag_run_clinician_review('synthetic-patient-b','released',
      '{"running_allowed":true,"adaptation_allowed":false}'::jsonb,
      '{"week":1,"sessions":[{"id":"urgent-release","segments":[{"type":"run","seconds":60,"rpeTarget":3}]}]}'::jsonb,
      'Teste sintético com urgência ativa');
    raise exception 'active urgent symptom was released';
  exception when invalid_parameter_value then null; end;
end $$;
reset role;
reset request.jwt.claim.sub;

set role anon;
do $$
declare a jsonb; b jsonb;
begin
  a:=public.hag_run_patient_context_v2(repeat('a',48));
  b:=public.hag_run_patient_context_v2(repeat('b',48));
  if a->'medical_authorization'->>'decision' not in ('released','released_with_restrictions') then raise exception 'authorized plan not restored: %',a; end if;
  if a->'medical_authorization'->'authorized_plan'->'sessions'->0->>'id'<>'clinician-session-next' then raise exception 'latest physician-authored plan not restored'; end if;
  if a->'program'->'progression_state'->>'current_week'<>'2' then raise exception 'new clinician-authored stage was not persisted'; end if;
  if b->'medical_authorization'<>'null'::jsonb or b->'program'<>'null'::jsonb then raise exception 'patient B received patient A data'; end if;
end $$;
reset role;

do $$
begin
  if (select count(*) from public.hag_run_medical_audit where patient_id='synthetic-patient-a')<>2 then raise exception 'audit rows missing after initial release and cycle adjustment'; end if;
  if has_function_privilege('anon','public.hag_run_patient_save_assessment(text,jsonb,jsonb,jsonb,jsonb)','execute') then raise exception 'legacy patient RPC can self-issue a prescription'; end if;
  if has_function_privilege('anon','public.hag_run_patient_context(text)','execute') then raise exception 'legacy patient context bypasses medical gate'; end if;
  if has_table_privilege('authenticated','public.hag_run_medical_authorizations','select') then raise exception 'direct authorization table read is granted'; end if;
end $$;
