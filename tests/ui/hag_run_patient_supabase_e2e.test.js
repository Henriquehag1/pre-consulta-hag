'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const apiUrl = process.env.HAG_RUN_LOCAL_API_URL;
const anonKey = process.env.HAG_RUN_LOCAL_ANON_KEY;
if (!apiUrl || !anonKey || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(apiUrl)) {
  throw new Error('This browser check must run against the temporary local Supabase stack.');
}

const root = path.resolve(__dirname, '../..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(target, (error, content) => {
      if (error) return res.writeHead(404).end('Not found');
      res.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream' });
      res.end(content);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.addInitScript(({ url, key }) => {
      window.HAG_RUN_CONFIG = { url, anonKey: key };
      let clock = 0;
      Object.defineProperty(performance, 'now', { configurable: true, value: () => clock });
      window.advanceHagTimer = milliseconds => { clock += milliseconds; };
    }, { url: apiUrl, key: anonKey });

    const patientUrl = `http://127.0.0.1:${address.port}/hag_run_HAG.html?t=${'a'.repeat(48)}`;
    await page.goto(patientUrl);
    await page.getByRole('heading', { name: 'Plano Rumo aos 5 km' }).waitFor();
    await page.getByText('Orientações e limites definidos pela equipe').waitFor();
    await page.getByRole('heading', { name: 'Sessões desta semana' }).waitFor();
    await page.getByRole('heading', { name: 'Histórico de execução' }).waitFor();
    await page.getByText(/Plano autorizado recuperado\. Histórico: 6 sessão\(ões\)\./).waitFor();

    await page.getByRole('button', { name: 'Iniciar esta sessão' }).click();
    await page.getByText('Caminhe e recupere', { exact: true }).waitFor();
    await page.evaluate(() => window.advanceHagTimer(120_000));
    await page.getByRole('heading', { name: 'Sessão concluída' }).waitFor();
    assert.equal(Number(await page.locator('#actualTime').inputValue()), 2, 'guided timer follows the 120-second prescription');
    await page.locator('#distance').fill('0.2');
    await page.getByRole('button', { name: 'Salvar execução' }).click();
    await page.getByText(/Execução registrada no HAG OS/).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Plano Rumo aos 5 km' }).waitFor();
    await page.getByText(/Plano autorizado recuperado\. Histórico: 7 sessão\(ões\)\./).waitFor();
    await page.getByText('Sessão sintética de homologação').waitFor();
    assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`);
    await context.close();
    console.log('Local Supabase browser E2E passed: physician-authored synthetic plan restored, mobile session executed and persisted, history recovered after reload.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
