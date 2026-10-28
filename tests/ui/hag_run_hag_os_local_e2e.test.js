'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const apiUrl = process.env.HAG_RUN_LOCAL_API_URL;
const anonKey = process.env.HAG_RUN_LOCAL_ANON_KEY;
const dbUrl = process.env.HAG_RUN_LOCAL_DB_URL;
const psql = process.env.HAG_RUN_LOCAL_PSQL;
const authSource = process.env.HAG_OS_AUTH_JS_PATH;
if (!apiUrl || !anonKey || !dbUrl || !psql || !authSource) {
  throw new Error('Set local Supabase values and the read-only path to HAG OS hag_auth.js.');
}
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(apiUrl)
  || !/(127\.0\.0\.1|localhost)/.test(dbUrl)) {
  throw new Error('Refusing to run HAG OS integration against a non-local Supabase project.');
}

const root = path.resolve(__dirname, '../..');
const authCode = fs.readFileSync(authSource, 'utf8');
const localPlan = {
  engineVersion: 'synthetic-hag-os-e2e-v1', status: 'ready', week: 3,
  classification: { level: 'R0', reviewReasons: [] },
  sessions: [{ id: 'hag-os-e2e-session', day: 'mon', title: 'Sessão sintética HAG OS',
    level: 'R0', objective: 'Validar integração local, sem finalidade clínica.', modality: 'road',
    durationSeconds: 120, durationMinutes: 2,
    segments: [{ type: 'walk', seconds: 120, rpeTarget: 2 }] }],
};

async function createSyntheticClinician() {
  const email = `hag-run-${crypto.randomUUID()}@example.test`;
  const password = `T-${crypto.randomBytes(24).toString('base64url')}!9a`;
  const response = await fetch(`${apiUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.user?.id || !payload.access_token) {
    throw new Error(`Local Supabase Auth did not issue a synthetic clinician session (HTTP ${response.status}).`);
  }
  if (!/^[0-9a-f-]{36}$/i.test(payload.user.id)) throw new Error('Unexpected synthetic clinician UUID.');
  execFileSync(psql, [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c',
    // HAG_RUN_CLINICIAN_REGISTRY_v1: vinculo so vale para medico cadastrado pelo processo administrativo.
    `select hag_run_private.register_clinician('${payload.user.id}','Médico sintético','CRM-TESTE','teste-e2e'); insert into public.hag_run_clinician_patient_access(clinician_user_id,patient_id) values ('${payload.user.id}','synthetic-patient-a');`],
  { stdio: 'ignore' });
  return {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in) || 3600) * 1000,
    userId: payload.user.id,
  };
}

async function main() {
  const clinician = await createSyntheticClinician();
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (pathname === '/hag_auth.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' }).end(authCode);
      return;
    }
    if (pathname === '/hag_run_hag_os_dev.html') {
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>HAG OS Dev isolado</title></head><body>
        <main><h1>HAG OS, host sintético local</h1><p>Stack Supabase temporária e paciente fictício.</p><div id="mount"></div></main>
        <script>window.HAG_CFG={SUPA_URL:${JSON.stringify(apiUrl)},SUPA_KEY:${JSON.stringify(anonKey)},EXIGIR_LOGIN:true};window.HAGMotor={paciente:{id:'synthetic-patient-a'}};</script>
        <script src="/hag_auth.js"></script><script src="/hag_run_hag_os_bridge.js"></script>
        <script>window.hagRunDevMount=HAGRunHostBridge.mount(document.getElementById('mount'),{panelUrl:'/hag_run_medico.html'});</script>
      </body></html>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
      return;
    }
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(target, (error, content) => {
      if (error) return res.writeHead(404).end('Not found');
      const type = path.extname(target) === '.html' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8';
      res.writeHead(200, { 'content-type': type }).end(content);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(session => {
      if (window !== window.top) return;
      localStorage.setItem('hag_auth_session', JSON.stringify({
        access_token: session.accessToken, expires_at: session.expiresAt, user: 'synthetic-clinician@example.test',
      }));
    }, clinician);
    const page = await context.newPage();
    const errors = [];
    const rpcResponses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', async response => {
      if (!response.url().includes('/rest/v1/rpc/')) return;
      rpcResponses.push({ url: response.url().split('/').pop(), status: response.status(), body: await response.text().catch(() => '') });
    });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const address = server.address();
    await page.goto(`http://127.0.0.1:${address.port}/hag_run_hag_os_dev.html`);
    const panel = page.frameLocator('iframe[title="Painel médico HAG RUN"]');
    assert.equal(await panel.locator('#patientId').inputValue(), 'synthetic-patient-a');
    try {
      await panel.getByText(/Solicitação carregada\. Revise os dados e registre uma decisão\.|Programa e histórico carregados\./).waitFor({ timeout: 10000 });
    } catch (_) {
      throw new Error(`Clinician context did not load. Status: ${await panel.locator('#status').textContent()}; RPC: ${JSON.stringify(rpcResponses)}`);
    }
    // HAG_RUN_MEDICO_FORM_v1: plano montado no formulário (duas sessões, uma etapa de caminhada de 2 min).
    await panel.locator('#instructions').fill('Plano de teste. Interrompa e solicite avaliação se houver sintoma.');
    const sess = panel.locator('[data-sess]');
    for (const [i, day] of [[0, 'mon'], [1, 'wed']]) {
      await sess.nth(i).locator('[data-f="day"]').selectOption(day);
      await sess.nth(i).locator('[data-f="title"]').fill('Sessão sintética HAG OS');
      await sess.nth(i).getByRole('button', { name: '+ Etapa' }).click();
      const seg = sess.nth(i).locator('[data-seg]').first();
      await seg.locator('[data-f="type"]').selectOption('walk');
      await seg.locator('[data-f="min"]').fill('2');
      await seg.locator('[data-f="rpe"]').fill('2');
    }
    await panel.locator('#reason').fill('Homologação técnica local com paciente e profissional sintéticos.');
    await panel.locator('button[data-action="released_with_restrictions"]').click();
    await panel.getByText(/Decisão registrada\. Autorização/).first().waitFor();
    assert.equal(await page.locator('iframe').getAttribute('sandbox'), 'allow-scripts');
    const frame = page.frames().find(item => item.url().includes('hag_run_medico.html'));
    assert.ok(frame, 'clinical panel iframe was mounted');
    assert.equal(await frame.evaluate(() => window.HAG_RUN_CLINICIAN_CONFIG || null), null,
      'host credentials must not be provided to the sandboxed panel');

    const patientPage = await context.newPage();
    await patientPage.addInitScript(({ url, key }) => {
      window.HAG_RUN_CONFIG = { url, anonKey: key };
      let clock = 0;
      Object.defineProperty(performance, 'now', { configurable: true, value: () => clock });
      window.advanceHagTimer = milliseconds => { clock += milliseconds; };
    }, { url: apiUrl, key: anonKey });
    await patientPage.route('https://fonts.googleapis.com/**', route => route.abort());
    await patientPage.goto(`http://127.0.0.1:${server.address().port}/hag_run_HAG.html?t=${'a'.repeat(48)}`);
    await patientPage.getByRole('heading', { name: 'Plano Rumo aos 5 km' }).waitFor();
    await patientPage.getByText('Plano de teste. Interrompa e solicite avaliação se houver sintoma.').waitFor();
    await patientPage.getByText(/Plano autorizado recuperado\. Histórico: 8 sessão\(ões\)\./).waitFor();
    await patientPage.getByRole('button', { name: 'Iniciar esta sessão' }).first().click();
    await patientPage.getByText('Caminhe e recupere', { exact: true }).waitFor();
    await patientPage.evaluate(() => window.advanceHagTimer(120_000));
    await patientPage.getByRole('heading', { name: 'Sessão concluída' }).waitFor();
    await patientPage.locator('#distance').fill('0.2');
    await patientPage.getByRole('button', { name: 'Salvar execução' }).click();
    await patientPage.getByText(/Execução registrada no HAG OS/).waitFor();
    await patientPage.reload();
    await patientPage.getByText(/Plano autorizado recuperado\. Histórico: 9 sessão\(ões\)\./).waitFor();

    await page.reload();
    const reopenedPanel = page.frameLocator('iframe[title="Painel médico HAG RUN"]');
    await reopenedPanel.getByText('Programa e histórico carregados. Você pode registrar revisão, ajuste ou suspensão.').waitFor();
    assert.match(await reopenedPanel.locator('#raw').textContent(), /sessao-1/,
      'the clinician context must show the persisted patient execution');
    assert.ok(await reopenedPanel.locator('#historico tbody tr').count() >= 1, 'history table lists the execution');
    await reopenedPanel.locator('#reason').fill('Suspensão sintética para validar revogação no fluxo local.');
    await reopenedPanel.locator('button[data-action="suspended"]').click();
    await reopenedPanel.getByText(/Decisão registrada\. Autorização/).first().waitFor();
    await patientPage.reload();
    await patientPage.getByRole('heading', { name: 'Corrida suspensa' }).waitFor();
    assert.equal(await patientPage.locator('[data-start]').count(), 0, 'suspension must remove executable sessions');
    assert.match(execFileSync(psql, [dbUrl, '-Atc',
      `select count(*) from public.hag_run_medical_audit where clinician_user_id='${clinician.userId}';`],
    { encoding: 'utf8' }).trim(), /^2$/, 'release and suspension must both have audit records');
    assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`);
    await context.close();
    console.log('Real HAGAuth bridge E2E passed against temporary local Supabase: clinician authorized a restricted plan, patient ran and persisted a session, clinician recovered history and suspended running; both decisions were audited and credentials stayed out of the iframe.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
