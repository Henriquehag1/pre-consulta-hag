'use strict';
// HAG_RUN_INTEGRACAO_v1 (28/10/2026): HAG RUN integrado ao HAG Treino, ponta a ponta, contra Supabase LOCAL.
// Paginas reais (treino_painel_HAG.html, treino_HAG.html, hag_run_HAG.html, hag_run_medico.html), login real
// (HAGAuth + Supabase Auth local), RPCs reais do HAG RUN. As RPCs e tabelas do HAG Treino nao existem no banco
// local e sao simuladas aqui. Producao e bloqueada: qualquer pedido ao Supabase remoto derruba o teste.
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
if (!apiUrl || !anonKey || !dbUrl || !psql) throw new Error('Rode por scripts/test-hag-run-supabase-local.sh.');
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(apiUrl) || !/(127\.0\.0\.1|localhost)/.test(dbUrl)) {
  throw new Error('Recusado: o teste só roda contra Supabase local.');
}
const PROD = /yutcnphwovqeiwcwzzhs\.supabase\.co/;
const root = path.resolve(__dirname, '../..');
const PID = 'synthetic-patient-c';
const TOKEN = 'e'.repeat(48);
const sql = q => execFileSync(psql, [dbUrl, '-v', 'ON_ERROR_STOP=1', '-Atc', q], { encoding: 'utf8' }).trim();

async function novoLogin() {
  const email = `hag-run-${crypto.randomUUID()}@example.test`;
  const password = `T-${crypto.randomBytes(24).toString('base64url')}!9a`;
  const r = await fetch(`${apiUrl}/auth/v1/signup`, { method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const j = await r.json();
  if (!r.ok || !j.user?.id || !j.access_token) throw new Error(`Auth local não emitiu sessão (HTTP ${r.status}).`);
  return { id: j.user.id, accessToken: j.access_token, expiresAt: Date.now() + (Number(j.expires_in) || 3600) * 1000, email };
}

async function rpcAnon(nome, body) {
  const r = await fetch(`${apiUrl}/rest/v1/rpc/${nome}`, { method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

function servidor() {
  const trocaConfig = html => html
    .replace(/window\.SUPA_URL='[^']*';window\.SUPA_KEY='[^']*';/, `window.SUPA_URL=${JSON.stringify(apiUrl)};window.SUPA_KEY=${JSON.stringify(anonKey)};`)
    .replace(/var SURL='https:\/\/yutcnphwovqeiwcwzzhs\.supabase\.co';\nvar SKEY='[^']*';/, `var SURL=${JSON.stringify(apiUrl)};\nvar SKEY=${JSON.stringify(anonKey)};`);
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const alvo = path.resolve(root, '.' + pathname);
    if (!alvo.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(alvo, (erro, conteudo) => {
      if (erro) return res.writeHead(404).end('Not found');
      const ext = path.extname(alvo);
      if (ext === '.html') {
        const html = trocaConfig(conteudo.toString('utf8'));
        if (PROD.test(html.replace(/hag_run_config\.js/g, ''))) {
          // so o hag_run_config.js pode conter o endereco de producao, e o teste sobrescreve a configuracao.
          if (/(window\.SUPA_URL|var SURL)=['"]https:\/\/yutcn/.test(html)) return res.writeHead(500).end('config de produção não trocada');
        }
        return res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
      }
      const tipo = ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.png' ? 'image/png' : 'application/octet-stream';
      res.writeHead(200, { 'content-type': tipo }).end(conteudo);
    });
  });
}

// Simulacao das RPCs e tabelas do HAG Treino (inexistentes no banco local).
const producao = [];
async function simulaTreino(page) {
  await page.route(PROD, r => { producao.push(r.request().url()); return r.abort(); });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('https://fonts.gstatic.com/**', r => r.abort());
  await page.route(/\/rest\/v1\/(?!rpc\/hag_run_)/, async r => {
    const u = new URL(r.request().url()); const p = u.pathname.split('/rest/v1/')[1];
    const J = b => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(b) });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' } });
    if (p === 'rpc/hag_treino_painel') return J({ ok: true, paciente: { id: PID, nome: 'Paciente Sintético C' }, acesso: { token: TOKEN, ultimo_uso: null }, programas: [], historico: [], exercicios: {}, liberacoes: [], versoes: [], bia: [] });
    if (p === 'rpc/hag_treino_contexto') return J({ ok: true, paciente: { nome: 'Sintético' }, hoje: new Date().toISOString().slice(0, 10), programa: null, exercicios: {}, historico: [], liberacoes: [], versoes: [], livres: [], catalogo: [] });
    if (p === 'patients') return J([{ id: PID, nome: 'Paciente Sintético C', status: 'ativo' }]);
    return J([]);
  });
}

async function main() {
  const medico = await novoLogin();
  const equipe = await novoLogin();
  sql(`select hag_run_private.register_clinician('${medico.id}','Médico sintético','CRM-TESTE','teste-integracao');`);
  const sub = await rpcAnon('hag_run_patient_submit_assessment', { p_token: TOKEN, p_assessment: { assessmentDate: '2026-10-28' }, p_profile: { inputs: { ageYears: 35, maxContinuousMinutes: 10 }, classification: { level: 'R1' } }, p_triage: { state: 'VERDE' } });
  assert.ok(sub.request_id, 'avaliação sintética enviada: ' + JSON.stringify(sub));

  const server = servidor();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const erros = [];
  try {
    const sessao = u => ({ access_token: u.accessToken, expires_at: u.expiresAt, user: u.email });

    // 1. Login da equipe sem cadastro de médico: vê o aviso e nenhuma ação clínica.
    const ctxEq = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    await ctxEq.addInitScript(s => { if (window === window.top) localStorage.setItem('hag_auth_session', JSON.stringify(s)); }, sessao(equipe));
    const pe = await ctxEq.newPage(); pe.on('pageerror', e => erros.push('equipe: ' + e.message)); await simulaTreino(pe);
    await pe.goto(`${base}/treino_painel_HAG.html?p=${PID}`);
    await pe.getByRole('tab', { name: 'Corrida' }).click();
    await pe.getByText(/não está cadastrado como médico do HAG RUN/).waitFor();
    assert.equal(await pe.locator('iframe').count(), 0, 'sem cadastro, o painel clínico não é montado');
    assert.equal(await pe.locator('[data-a="runvinc"]').count(), 0, 'sem cadastro, não há botão de vínculo');
    await ctxEq.close();

    // 2. Médico cadastrado: vincula com motivo, prescreve no formulário, libera com restrições.
    const ctxMed = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    await ctxMed.addInitScript(s => { if (window === window.top) localStorage.setItem('hag_auth_session', JSON.stringify(s)); }, sessao(medico));
    const pm = await ctxMed.newPage(); pm.on('pageerror', e => erros.push('médico: ' + e.message)); await simulaTreino(pm);
    await pm.goto(`${base}/treino_painel_HAG.html?p=${PID}`);
    await pm.getByRole('tab', { name: 'Corrida' }).click();
    await pm.getByText(/ainda não está vinculado a você/).waitFor();
    assert.match(await pm.locator('#run-link').textContent(), new RegExp(`hag_run_HAG\\.html\\?t=${TOKEN}$`), 'link da corrida = mesmo link pessoal');
    await pm.locator('[data-a="runvinc"]').click();
    await pm.getByText('Escreva o motivo do vínculo.').waitFor();
    await pm.locator('#run-motivo').fill('Início do acompanhamento de corrida (teste)');
    await pm.locator('[data-a="runvinc"]').click();
    await pm.getByText('Paciente vinculado ao HAG RUN.').waitFor();
    const painel = pm.frameLocator('iframe[title="Painel médico HAG RUN"]');
    await painel.getByText('Solicitação carregada. Revise os dados e registre uma decisão.').waitFor();
    assert.match(await painel.locator('#avaliacao').textContent(), /Triagem: VERDE[\s\S]*Corrida contínua atual \(min\)10/);
    const sess = painel.locator('[data-sess]');
    for (const [i, dia] of [[0, 'tue'], [1, 'thu']]) {
      await sess.nth(i).locator('[data-f="day"]').selectOption(dia);
      await sess.nth(i).locator('[data-r="n"]').fill('2');
      await sess.nth(i).locator('[data-r="run"]').fill('30');
      await sess.nth(i).locator('[data-r="rpeRun"]').fill('4');
      await sess.nth(i).locator('[data-r="walk"]').fill('30');
      await sess.nth(i).locator('[data-r="rpeWalk"]').fill('2');
      await sess.nth(i).getByRole('button', { name: 'Inserir' }).click();
    }
    assert.match(await painel.locator('#totalPlano').textContent(), /4 min/, 'total da semana: 2 sessões × 2 min');
    await painel.locator('#reason').fill('Liberação de teste com restrições.');
    await painel.locator('button[data-action="released_with_restrictions"]').click();
    await painel.getByText('Na liberação com restrições, escreva as orientações para o paciente.').waitFor();
    await painel.locator('#instructions').fill('Ritmo leve; pare se houver dor.');
    await painel.locator('button[data-action="released_with_restrictions"]').click();
    try { await painel.getByText(/Decisão registrada\. Autorização/).first().waitFor({ timeout: 10000 }); }
    catch (_) { throw new Error('liberação não registrada: ' + await painel.locator('#decStatus').textContent()); }
    assert.equal(await pm.locator('iframe').getAttribute('sandbox'), 'allow-scripts');
    const fr = pm.frames().find(f => f.url().includes('hag_run_medico.html'));
    assert.equal(await fr.evaluate(() => window.HAG_RUN_CLINICIAN_CONFIG || null), null, 'iframe sem credenciais');

    // 3. Paciente: app do Treino mostra o card Corrida "Liberada"; abre a corrida e registra a sessão.
    const ctxPac = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctxPac.addInitScript(({ url, key }) => {
      window.HAG_RUN_CONFIG = { url, anonKey: key };
      let clock = 0; Object.defineProperty(performance, 'now', { configurable: true, value: () => clock });
      window.advanceHagTimer = ms => { clock += ms; };
    }, { url: apiUrl, key: anonKey });
    const pp = await ctxPac.newPage(); pp.on('pageerror', e => erros.push('paciente: ' + e.message)); await simulaTreino(pp);
    await pp.goto(`${base}/treino_HAG.html?t=${TOKEN}`);
    await pp.locator('#tab-livre').waitFor({ state: 'visible' });
    await pp.locator('#tab-livre').click();
    const card = pp.locator('a.runcard');
    await card.waitFor();
    assert.match(await card.textContent(), /Liberada/);
    await card.click();
    await pp.getByRole('heading', { name: 'Plano Rumo aos 5 km' }).waitFor();
    await pp.getByText('Ritmo leve; pare se houver dor.').first().waitFor();
    assert.equal(await pp.locator('#voltaTreino').getAttribute('href'), `treino_HAG.html?t=${TOKEN}`, 'volta ao Treino com o mesmo link');
    await pp.getByRole('button', { name: 'Iniciar esta sessão' }).first().click();
    for (let i = 0; i < 4; i++) { await pp.evaluate(() => window.advanceHagTimer(30_000)); await pp.waitForTimeout(400); }
    await pp.getByRole('heading', { name: 'Sessão concluída' }).waitFor();
    await pp.locator('#distance').fill('0.3');
    await pp.getByRole('button', { name: 'Salvar execução' }).click();
    await pp.getByText(/Execução registrada no HAG OS/).waitFor();
    assert.equal(sql(`select count(*) from public.hag_run_executions where patient_id='${PID}';`), '1', 'execução persistida');

    // 4. Médico vê a sessão no histórico e suspende; o card do paciente passa a "Suspensa" e some o plano.
    await pm.reload();
    await pm.getByRole('tab', { name: 'Corrida' }).click();
    await pm.getByText('Paciente vinculado a você no HAG RUN.').waitFor();
    const painel2 = pm.frameLocator('iframe[title="Painel médico HAG RUN"]');
    await painel2.getByText(/Programa e histórico carregados/).waitFor();
    assert.equal(await painel2.locator('#historico tbody tr').count(), 1, 'sessão do paciente no histórico do médico');
    await painel2.locator('#decision').selectOption('suspended');
    await painel2.locator('#reason').fill('Suspensão de teste.');
    await painel2.locator('button[data-action="suspended"]').click();
    await painel2.getByText(/Decisão registrada\. Autorização/).first().waitFor();
    await pp.goto(`${base}/treino_HAG.html?t=${TOKEN}`);
    await pp.locator('#tab-livre').click();
    await pp.locator('a.runcard').waitFor();
    assert.match(await pp.locator('a.runcard').textContent(), /Suspensa/);
    await pp.locator('a.runcard').click();
    await pp.getByRole('heading', { name: 'Corrida suspensa' }).waitFor();
    assert.equal(await pp.locator('[data-start]').count(), 0, 'suspensa: nenhuma sessão executável');
    const bloqueio = await rpcAnon('hag_run_patient_save_execution', { p_token: TOKEN, p_client_event_id: crypto.randomUUID(), p_session_id: 'sessao-1', p_execution: { completed: true, duration_seconds: 120, distance_km: 0.3, rpe: 3, difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good' } });
    assert.ok(!bloqueio.ok || bloqueio.error || bloqueio.code, 'servidor recusa execução com corrida suspensa: ' + JSON.stringify(bloqueio));

    // 5. Auditoria: vínculo e as duas decisões registradas, com o médico como ator.
    assert.equal(sql(`select count(*) from public.hag_run_access_audit where patient_id='${PID}' and action='link' and clinician_user_id='${medico.id}';`), '1');
    assert.equal(sql(`select string_agg(decision, ',' order by created_at) from public.hag_run_medical_audit where patient_id='${PID}';`), 'released_with_restrictions,suspended');
    assert.deepEqual(producao, [], 'nenhum pedido pode ir ao Supabase de produção');
    assert.deepEqual(erros, [], 'erros de página: ' + erros.join(' | '));
    console.log('HAG RUN integrado ao HAG Treino (Supabase local): login sem cadastro barrado; médico vinculou com motivo, prescreveu no formulário e liberou com restrições; paciente achou a corrida no app do Treino, executou e salvou; médico viu o histórico e suspendeu; card e servidor refletiram a suspensão; vínculo e decisões auditados.');
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
}
main().catch(e => { console.error(e.stack || e.message); process.exitCode = 1; });
