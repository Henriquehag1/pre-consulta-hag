\set ON_ERROR_STOP on

-- Real PostgreSQL RPC, authorization, persistence and RLS checks. Every row is synthetic.
set role anon;

do $$
declare
  v_result jsonb;
  v_program_id uuid;
  v_prescription_id uuid;
  v_execution_id uuid;
begin
  v_result := public.hag_run_patient_context(repeat('a', 48));
  if v_result->>'ok' <> 'true' or v_result->'program' <> 'null'::jsonb then
    raise exception 'new patient context should be empty and authorized: %', v_result;
  end if;

  foreach v_result in array array[
    public.hag_run_patient_context(repeat('x', 48)),
    public.hag_run_patient_context(repeat('c', 48)),
    public.hag_run_patient_context(repeat('d', 48))
  ] loop
    if v_result->>'ok' <> 'false' or v_result->>'error' <> 'invalid_link' then
      raise exception 'invalid/revoked/expired link was accepted: %', v_result;
    end if;
  end loop;

  v_result := public.hag_run_patient_save_assessment(
    repeat('a', 48),
    '{"assessmentDate":"2026-10-27"}'::jsonb,
    '{"inputs":{"currentPain":0},"functional":{"level":"R0"}}'::jsonb,
    '{"slug":"rumo_5k","title":"Rumo aos 5 km","goal":"5k"}'::jsonb,
    '{"engine_version":"hag-run-engine/0.1.0","plan":{"week":1,"sessions":[{"id":"synthetic-session-mon"},{"id":"synthetic-session-wed"}]}}'::jsonb
  );
  if v_result->>'ok' <> 'true' then raise exception 'assessment save failed: %', v_result; end if;
  v_program_id := (v_result->>'program_id')::uuid;
  v_prescription_id := (v_result->>'prescription_id')::uuid;

  v_result := public.hag_run_patient_save_assessment(
    repeat('a', 48), '{"assessmentDate":"2026-10-27"}'::jsonb,
    '{"inputs":{"currentPain":0},"functional":{"level":"R0"}}'::jsonb,
    '{"slug":"rumo_5k","title":"Rumo aos 5 km","goal":"5k"}'::jsonb,
    '{"engine_version":"hag-run-engine/0.1.0","plan":{"week":1,"sessions":[{"id":"tampered-session"}]}}'::jsonb
  );
  if v_result->>'error' <> 'prescription_immutable' then
    raise exception 'same-week prescription mutation was not rejected: %', v_result;
  end if;

  v_result := public.hag_run_patient_save_execution(
    repeat('b', 48), '11111111-1111-4111-8111-111111111111'::uuid,
    'synthetic-session-mon',
    '{"completed":true,"duration_seconds":1200,"distance_km":2,"rpe":5,"difficulty":"easy","pain":0,"fatigue":3,"recovery":"good"}'::jsonb
  );
  if v_result->>'error' <> 'session_not_in_prescription' then
    raise exception 'patient B accessed patient A prescription: %', v_result;
  end if;

  v_result := public.hag_run_patient_save_execution(
    repeat('a', 48), '11111111-1111-4111-8111-111111111111'::uuid,
    'synthetic-session-mon',
    '{"completed":true,"duration_seconds":1200,"distance_km":2,"rpe":5,"difficulty":"easy","pain":0,"fatigue":3,"recovery":"good"}'::jsonb
  );
  if v_result->>'ok' <> 'true' or v_result->'recommendation'->>'action' <> 'repeat' then
    raise exception 'first tolerated execution should not progress: %', v_result;
  end if;
  v_execution_id := (v_result->>'execution_id')::uuid;

  v_result := public.hag_run_patient_save_execution(
    repeat('a', 48), '22222222-2222-4222-8222-222222222222'::uuid,
    'synthetic-session-wed',
    '{"completed":true,"duration_seconds":1200,"distance_km":2,"rpe":5,"difficulty":"easy","pain":0,"fatigue":3,"recovery":"good"}'::jsonb
  );
  if v_result->'recommendation'->>'action' <> 'progress' then
    raise exception 'two consecutive tolerated executions should progress: %', v_result;
  end if;

  -- An identical retry returns the original row even if the current recommendation changed.
  v_result := public.hag_run_patient_save_execution(
    repeat('a', 48), '22222222-2222-4222-8222-222222222222'::uuid,
    'synthetic-session-wed',
    '{"completed":true,"duration_seconds":1200,"distance_km":2,"rpe":5,"difficulty":"easy","pain":0,"fatigue":3,"recovery":"good"}'::jsonb
  );
  if v_result->>'duplicate' <> 'true' then raise exception 'retry was not idempotent: %', v_result; end if;

  v_result := public.hag_run_patient_save_execution(
    repeat('a', 48), '33333333-3333-4333-8333-333333333333'::uuid,
    'synthetic-session-mon',
    '{"completed":false,"duration_seconds":300,"distance_km":0.5,"rpe":9,"difficulty":"hard","pain":0,"fatigue":9,"recovery":"poor"}'::jsonb
  );
  if v_result->'recommendation'->>'action' <> 'repeat' then
    raise exception 'a non-completed session should not progress: %', v_result;
  end if;

  v_result := public.hag_run_patient_save_execution(
    repeat('a', 48), '44444444-4444-4444-8444-444444444444'::uuid,
    'synthetic-session-mon',
    '{"completed":true,"duration_seconds":900,"distance_km":1.5,"rpe":5,"difficulty":"moderate","pain":4,"fatigue":3,"recovery":"good"}'::jsonb
  );
  if v_result->'recommendation'->>'action' <> 'professional_review' then
    raise exception 'significant pain should require professional review: %', v_result;
  end if;

  v_result := public.hag_run_patient_save_execution(
    repeat('a', 48), '55555555-5555-4555-8555-555555555555'::uuid,
    'synthetic-session-wed',
    '{"completed":true,"duration_seconds":900,"distance_km":1.5,"rpe":5,"difficulty":"moderate","pain":0,"fatigue":3,"recovery":"poor"}'::jsonb
  );
  if v_result->'recommendation'->>'action' <> 'reduce' then
    raise exception 'insufficient recovery should reduce the load: %', v_result;
  end if;

  v_result := public.hag_run_patient_save_assessment(
    repeat('a', 48), '{"assessmentDate":"2026-10-27"}'::jsonb,
    '{"inputs":{"currentPain":0},"functional":{"level":"R0"}}'::jsonb,
    '{"slug":"rumo_5k","title":"Rumo aos 5 km","goal":"5k"}'::jsonb,
    '{"engine_version":"hag-run-engine/0.1.0","plan":{"week":2,"sessions":[{"id":"synthetic-session-next-week"}]}}'::jsonb
  );
  if v_result->>'error' <> 'progression_not_authorized' then
    raise exception 'week advance after insufficient recovery should be denied: %', v_result;
  end if;

  v_result := public.hag_run_patient_context(repeat('a', 48));
  if v_result->'history' is null or jsonb_array_length(v_result->'history') <> 5 then
    raise exception 'context did not restore the five persisted executions: %', v_result;
  end if;
  if v_result->'program'->>'progression_state' is null then
    raise exception 'persisted progression state missing';
  end if;

  begin
    perform * from public.hag_run_programs;
    raise exception 'anon unexpectedly has direct table read access';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set role authenticated;
do $$
begin
  begin
    perform public.hag_run_patient_context(repeat('a', 48));
    raise exception 'authenticated role unexpectedly has patient RPC access';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

do $$
begin
  if (select count(*) from public.hag_run_programs where patient_id = 'synthetic-patient-a') <> 1 then
    raise exception 'expected exactly one patient A program';
  end if;
  if (select count(*) from public.hag_run_executions where patient_id = 'synthetic-patient-a') <> 5 then
    raise exception 'expected exactly five patient A executions';
  end if;
  if exists (select 1 from public.hag_run_programs where patient_id = 'synthetic-patient-b') then
    raise exception 'patient B received patient A data';
  end if;
end;
$$;
