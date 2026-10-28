\set ON_ERROR_STOP on
set role anon;
select public.hag_run_patient_save_execution(repeat('a',48),'88888888-8888-4888-8888-888888888888'::uuid,
  'clinician-session-next','{"completed":false,"duration_seconds":120,"distance_km":0,"rpe":5,"difficulty":"moderate","pain":1,"fatigue":3,"recovery":"partial"}'::jsonb);
do $$
declare ctx jsonb; v_state text;
begin
  ctx:=public.hag_run_patient_context_v2(repeat('a',48));
  if ctx->'prescription'<>'null'::jsonb or ctx->>'pending_review'<>'true' then
    raise exception 'symptom during execution did not place an immediate hold';
  end if;
  begin
    perform public.hag_run_patient_save_execution(repeat('a',48),'99999999-9999-4999-8999-999999999999'::uuid,
      'clinician-session-next','{"completed":false,"duration_seconds":1,"distance_km":0,"rpe":1,"difficulty":"easy","pain":0,"fatigue":0,"recovery":"good"}'::jsonb);
    raise exception 'patient recorded execution while medical hold active';
  exception when others then
    get stacked diagnostics v_state=returned_sqlstate;
    if v_state<>'42501' then raise; end if;
  end;
end $$;
reset role;
