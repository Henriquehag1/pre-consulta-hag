\set ON_ERROR_STOP on
-- HAG_RUN_CLINICIAN_REGISTRY_v1. Roda depois da 0002 e dos testes dela. Ids sinteticos.
-- 1111: medico que tinha vinculo direto antes da 0003 (nao cadastrado). 3333: medico cadastrado.
-- 4444: login da equipe sem cadastro (ex.: secretaria). Pacientes sinteticos A e B.

-- 0. A migracao revogou os vinculos de quem nao esta cadastrado (fail-closed).
do $$ begin
  if exists (select 1 from public.hag_run_clinician_patient_access
             where clinician_user_id = '11111111-1111-4111-8111-111111111111' and revoked_at is null) then
    raise exception 'pre-registry links must be revoked by 0003';
  end if;
end $$;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set role authenticated;
do $$ begin
  begin perform public.hag_run_clinician_context('synthetic-patient-a');
    raise exception 'unregistered clinician still reads context';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 1. Cadastro so pelo dono do banco: as roles da API nao executam a funcao privada.
set role authenticated;
do $$ begin
  begin perform hag_run_private.register_clinician('44444444-4444-4444-8444-444444444444', 'Auto cadastro', null, 'self');
    raise exception 'authenticated registered itself as clinician';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin perform public.hag_run_clinician_me(); raise exception 'anon reached clinician_me';
  exception when insufficient_privilege then null; end;
  begin perform public.hag_run_clinician_link_patient('synthetic-patient-a', 'tentativa anonima'); raise exception 'anon reached link';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select hag_run_private.register_clinician('33333333-3333-4333-8333-333333333333', 'Medico sintetico', 'CRM-TESTE', 'teste-sql');

-- 2. Insercao direta de vinculo para quem nao esta cadastrado e recusada mesmo pelo dono.
do $$ begin
  begin insert into public.hag_run_clinician_patient_access(clinician_user_id, patient_id)
        values ('44444444-4444-4444-8444-444444444444', 'synthetic-patient-a');
    raise exception 'direct link for unregistered clinician was accepted';
  exception when insufficient_privilege then null; end;
end $$;

-- 3. Login sem cadastro (secretaria): ve que nao e medico, nao vincula, nao le, nao prescreve.
set request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set role authenticated;
do $$ declare me jsonb; begin
  me := public.hag_run_clinician_me();
  if me->>'registered' <> 'false' then raise exception 'staff login reported as clinician: %', me; end if;
  begin perform public.hag_run_clinician_link_patient('synthetic-patient-a', 'tentativa da equipe');
    raise exception 'unregistered staff linked a patient';
  exception when insufficient_privilege then null; end;
  begin perform public.hag_run_clinician_review('synthetic-patient-a', 'suspended', '{"running_allowed":false}'::jsonb, null, 'tentativa');
    raise exception 'unregistered staff reviewed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 4. Medico cadastrado: valida motivo e paciente, vincula com idempotencia, le, desvincula.
set request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set role authenticated;
do $$ declare r jsonb; c jsonb; begin
  r := public.hag_run_clinician_me();
  if r->>'registered' <> 'true' or r->>'role' <> 'medico' then raise exception 'registered clinician not recognized: %', r; end if;
  begin perform public.hag_run_clinician_link_patient('synthetic-patient-a', ''); raise exception 'empty reason accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.hag_run_clinician_link_patient('nao-existe', 'paciente inexistente'); raise exception 'unknown patient linked';
  exception when no_data_found then null; end;
  begin perform public.hag_run_clinician_context('synthetic-patient-a'); raise exception 'context before link';
  exception when insufficient_privilege then null; end;
  r := public.hag_run_clinician_link_patient('synthetic-patient-a', 'Inicio do acompanhamento de corrida');
  if r->>'already_linked' <> 'false' then raise exception 'first link: %', r; end if;
  r := public.hag_run_clinician_link_patient('synthetic-patient-a', 'Repeticao');
  if r->>'already_linked' <> 'true' then raise exception 'idempotent link: %', r; end if;
  c := public.hag_run_clinician_context('synthetic-patient-a');
  if c->>'ok' <> 'true' then raise exception 'linked clinician cannot read: %', c; end if;
  begin perform public.hag_run_clinician_context('synthetic-patient-b'); raise exception 'read unlinked patient B';
  exception when insufficient_privilege then null; end;
  r := public.hag_run_clinician_unlink_patient('synthetic-patient-a', 'Teste de desvinculo');
  if r->>'was_linked' <> 'true' then raise exception 'unlink: %', r; end if;
  begin perform public.hag_run_clinician_context('synthetic-patient-a'); raise exception 'read after unlink';
  exception when insufficient_privilege then null; end;
  perform public.hag_run_clinician_link_patient('synthetic-patient-a', 'Religar para o teste de desativacao');
end $$;
reset role;

-- 5. Desativar o medico revoga os vinculos na mesma transacao; auditoria registra tudo.
select hag_run_private.deactivate_clinician('33333333-3333-4333-8333-333333333333', 'Teste de desativacao', 'teste-sql');
set request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set role authenticated;
do $$ begin
  if public.hag_run_clinician_me()->>'registered' <> 'false' then raise exception 'deactivated clinician still registered'; end if;
  begin perform public.hag_run_clinician_context('synthetic-patient-a'); raise exception 'deactivated clinician still reads';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare n integer; begin
  select count(*) into n from public.hag_run_access_audit where clinician_user_id = '33333333-3333-4333-8333-333333333333';
  if n <> 5 then raise exception 'expected 5 audit rows (registered, link, unlink, link, deactivated; repeated link is not audited), got %', n; end if;
  if exists (select 1 from public.hag_run_clinician_patient_access
             where clinician_user_id = '33333333-3333-4333-8333-333333333333' and revoked_at is null) then
    raise exception 'links survived deactivation';
  end if;
end $$;

-- 6. Tabelas novas fechadas para a API.
set role authenticated;
do $$ begin
  begin perform 1 from public.hag_run_clinicians; raise exception 'clinician table readable';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.hag_run_access_audit; raise exception 'audit table readable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'hag_run_clinician_registry tests passed' as result;
