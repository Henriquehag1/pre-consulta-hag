'use strict';

import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const stackRoot = resolve(root, '.local/hag-run-supabase');
const credentialPath = resolve(stackRoot, 'dev-clinician.json');
const cliEnv = { ...process.env, SUPABASE_EXPERIMENTAL_STACK: '1' };

function stackSettings() {
  const output = execFileSync('supabase', [
    'stack', 'status', '--stack', 'hag-run-dev', '--workdir', stackRoot, '--env', '--output-format', 'text',
  ], { encoding: 'utf8', env: cliEnv });
  const values = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  const apiUrl = values.API_URL;
  const anonKey = values.ANON_KEY || values.PUBLISHABLE_KEY;
  const dbUrl = values.DB_URL;
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(apiUrl || '')
    || !/(127\.0\.0\.1|localhost)/.test(dbUrl || '') || !anonKey || /service[_-]?role/i.test(anonKey)) {
    throw new Error('A configuração retornada não é uma stack Supabase local e pública.');
  }
  return { apiUrl, anonKey, dbUrl };
}

function findPsql() {
  try {
    const prefix = execFileSync('brew', ['--prefix', 'postgresql@17'], { encoding: 'utf8' }).trim();
    const candidate = resolve(prefix, 'bin/psql');
    if (existsSync(candidate)) return candidate;
  } catch (_) {}
  return execFileSync('which', ['psql'], { encoding: 'utf8' }).trim();
}

function query(psql, dbUrl, sql) {
  return execFileSync(psql, [dbUrl, '-X', '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' }).trim();
}

function runSqlFile(psql, dbUrl, path) {
  execFileSync(psql, [dbUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-f', path], { stdio: 'inherit' });
}

async function authenticateOrCreate({ apiUrl, anonKey }) {
  let credentials;
  if (existsSync(credentialPath)) credentials = JSON.parse(readFileSync(credentialPath, 'utf8'));
  else credentials = { email: 'hag-run-clinician@example.test', password: `${randomBytes(24).toString('base64url')}A9!` };

  const login = async () => {
    const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok ? result : null;
  };
  let session = await login();
  if (!session?.user?.id) {
    if (existsSync(credentialPath)) {
      throw new Error('A conta sintética gravada localmente não autenticou. Verifique a stack local antes de prosseguir.');
    }
    const response = await fetch(`${apiUrl}/auth/v1/signup`, {
      method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    session = await response.json().catch(() => ({}));
    if (!response.ok || !session?.user?.id || !session.access_token) {
      throw new Error(`Não foi possível criar a conta clínica sintética no Supabase local (HTTP ${response.status}).`);
    }
    credentials.userId = session.user.id;
    mkdirSync(dirname(credentialPath), { recursive: true, mode: 0o700 });
    writeFileSync(credentialPath, JSON.stringify(credentials, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    chmodSync(credentialPath, 0o600);
    process.stdout.write('Conta clínica sintética criada. As credenciais locais estão no arquivo ignorado pelo Git: .local/hag-run-supabase/dev-clinician.json\n');
  }
  const userId = session.user.id;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error('Supabase Auth retornou UUID inesperado para a conta sintética.');
  return userId;
}

async function main() {
  if (!existsSync(resolve(stackRoot, 'supabase/config.toml'))) {
    throw new Error('Inicie primeiro a stack isolada com npm run dev:hag-os.');
  }
  const { apiUrl, anonKey, dbUrl } = stackSettings();
  const psql = findPsql();
  const migrationsTables = [
    'public.hag_run_programs', 'public.hag_run_prescriptions', 'public.hag_run_executions',
    'public.hag_run_assessment_requests', 'public.hag_run_medical_authorizations',
  ];
  const existing = Number(query(psql, dbUrl,
    `select count(*) from unnest(array[${migrationsTables.map(name => `'${name}'`).join(',')}]) as t(name) where to_regclass(t.name) is not null`));
  if (existing === 0) {
    runSqlFile(psql, dbUrl, resolve(root, 'tests/sql/hag_run_fixture.sql'));
    runSqlFile(psql, dbUrl, resolve(root, 'supabase/migrations/202610270001_hag_run.sql'));
    runSqlFile(psql, dbUrl, resolve(root, 'supabase/migrations/202610270002_hag_run_medical_gate.sql'));
    runSqlFile(psql, dbUrl, resolve(root, 'supabase/migrations/202610280003_hag_run_clinician_registry.sql'));
    execFileSync(psql, [dbUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-c', `
      set role anon;
      select public.hag_run_patient_submit_assessment(
        repeat('a',48),
        jsonb_build_object('assessmentDate',current_date,'synthetic',true,'dev_fixture',true),
        jsonb_build_object('inputs',jsonb_build_object('ageYears',35,'maxContinuousMinutes',0,'synthetic',true)),
        jsonb_build_object('state','AMARELO','synthetic',true)
      );
      reset role;
    `], { stdio: 'inherit' });
    process.stdout.write('Schema HAG RUN e pedido de triagem sintético instalados somente na stack local.\n');
  } else if (existing !== migrationsTables.length) {
    throw new Error(`Schema local incompleto (${existing}/${migrationsTables.length} tabelas). Não apliquei novas migrations; revise a stack local.`);
  } else {
    process.stdout.write('Schema local já inicializado; nenhum dado foi apagado ou recriado.\n');
  }
  // HAG_RUN_CLINICIAN_REGISTRY_v1: stack criada antes da 0003 recebe a migracao aditiva uma vez.
  if (query(psql, dbUrl, `select to_regclass('public.hag_run_clinicians') is null`) === 't') {
    runSqlFile(psql, dbUrl, resolve(root, 'supabase/migrations/202610280003_hag_run_clinician_registry.sql'));
  }

  const clinicianId = await authenticateOrCreate({ apiUrl, anonKey });
  // Processo administrativo (dono do banco local): cadastra o medico sintetico; o vinculo vale so para medico cadastrado.
  query(psql, dbUrl, `select hag_run_private.register_clinician('${clinicianId}','Médico sintético local','CRM-DEV','hag-run-dev-db-setup')`);
  query(psql, dbUrl, `insert into public.hag_run_clinician_patient_access(clinician_user_id,patient_id)
    values ('${clinicianId}','synthetic-patient-a') on conflict (clinician_user_id,patient_id)
    do update set revoked_at=null`);
  if (!existsSync(credentialPath)) {
    throw new Error('Conta sintética autenticada, mas o arquivo local de credenciais não foi criado.');
  }
  process.stdout.write('Vínculo sintético ativo: profissional local → synthetic-patient-a. Dados reais e Supabase remoto não foram usados.\n');
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
