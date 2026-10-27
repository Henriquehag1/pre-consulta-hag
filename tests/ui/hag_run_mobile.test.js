'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const root = path.resolve(__dirname, '../..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

function createServer() {
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(target, (error, data) => {
      if (error) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

async function main() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const viewports = [
      { name: 'compact 320px', width: 320, height: 720, mobile: true },
      { ...devices['iPhone 13'], name: 'iPhone 13', mobile: true },
      { name: 'tablet 768px', width: 768, height: 1024, mobile: true },
    ];
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: viewport.viewport || { width: viewport.width, height: viewport.height },
        screen: viewport.screen,
        deviceScaleFactor: viewport.deviceScaleFactor || 2,
        isMobile: viewport.mobile,
        hasTouch: true,
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(`${viewport.name}: ${error.message}`));
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      await page.addInitScript(() => {
        let clock = 0;
        Object.defineProperty(performance, 'now', { configurable: true, value: () => clock });
        window.advanceHagTimer = milliseconds => { clock += milliseconds; };
      });
      await page.goto(`http://127.0.0.1:${address.port}/hag_run_HAG.html`);
      await page.getByText(/Modo de demonstração/).waitFor();
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= dimensions.width, `${viewport.name} has horizontal overflow: ${JSON.stringify(dimensions)}`);
      const buttons = await page.locator('button').evaluateAll(items => items.filter(item => item.getClientRects().length).map(item => item.getBoundingClientRect().height));
      assert.ok(buttons.every(height => height >= 44), `${viewport.name} has a tap target below 44px: ${buttons}`);

      await page.locator('#continuous').fill('0');
      await page.locator('#days').fill('0');
      await page.locator('#weekly').fill('0');
      await page.locator('#longest').fill('0');
      await page.locator('#painNow').fill('0');
      await page.locator('#availableDays input[value="mon"]').check();
      await page.locator('#availableDays input[value="wed"]').check();
      await page.getByRole('button', { name: 'Ver minha avaliação e sessões' }).click();
      await page.getByRole('heading', { name: 'Plano Rumo aos 5 km' }).waitFor();
      assert.equal(await page.locator('#plan article.session').count(), 2, `${viewport.name} should display two spaced sessions`);
      assert.equal(await page.locator('#plan .meta').filter({ hasText: 'Programa: Rumo aos 5 km' }).count(), 1);

      if (viewport.name === 'compact 320px') {
        const session = page.locator('#plan article.session').first();
        const plannedSegments = await session.locator('.segment b').allTextContents();
        const plannedSeconds = plannedSegments.reduce((total, text) => {
          const [minutes, seconds] = text.split(':').map(Number);
          return total + minutes * 60 + seconds;
        }, 0);
        await session.getByRole('button', { name: 'Iniciar esta sessão' }).click();
        const eventKey = 'hag-run-pending:hag-run-r0-w1-mon';
        const pendingEventId = await page.evaluate(key => sessionStorage.getItem(key), eventKey);
        assert.match(pendingEventId, /^[0-9a-f-]{36}$/i, 'an unfinished session keeps a retry key in session storage');
        await page.reload();
        await page.getByText(/Modo de demonstração/).waitFor();
        await page.locator('#continuous').fill('0');
        await page.locator('#days').fill('0');
        await page.locator('#weekly').fill('0');
        await page.locator('#longest').fill('0');
        await page.locator('#painNow').fill('0');
        await page.locator('#availableDays input[value="mon"]').check();
        await page.locator('#availableDays input[value="wed"]').check();
        await page.getByRole('button', { name: 'Ver minha avaliação e sessões' }).click();
        await page.getByRole('heading', { name: 'Plano Rumo aos 5 km' }).waitFor();
        await page.locator('#plan article.session').first().getByRole('button', { name: 'Iniciar esta sessão' }).click();
        assert.equal(await page.evaluate(key => sessionStorage.getItem(key), eventKey), pendingEventId,
          'reopening the same prescribed session reuses its idempotency key');
        await page.getByText('Aquecimento caminhando', { exact: true }).waitFor();
        for (const label of plannedSegments) {
          const [minutes, seconds] = label.split(':').map(Number);
          await page.evaluate(secondsToAdvance => window.advanceHagTimer(secondsToAdvance * 1000), minutes * 60 + seconds);
          await page.waitForTimeout(220);
        }
        await page.getByRole('heading', { name: 'Sessão concluída' }).waitFor();
        const recordedMinutes = Number(await page.locator('#actualTime').inputValue());
        assert.ok(Math.abs(recordedMinutes * 60 - plannedSeconds) <= 1, `timer elapsed ${recordedMinutes * 60}s for ${plannedSeconds}s prescription`);
        await page.locator('#distance').fill('2');
        await page.getByRole('button', { name: 'Salvar execução' }).click();
        await page.getByText(/Modo de demonstração\. O histórico permanecerá nesta tela/).waitFor();
        assert.equal(await page.evaluate(key => sessionStorage.getItem(key), eventKey), null,
          'the pending idempotency key is removed after a successful record');
        await page.getByRole('button', { name: 'Revisar ou repetir esta semana' }).click();
        await page.getByRole('heading', { name: 'Histórico de execução' }).waitFor();
      }
      await context.close();
    }
    assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`);
    console.log('Mobile UI checks passed at 320px, iPhone 13 emulation, and 768px; completed-session duration matched the prescribed segment total.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
