'use strict';

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const hostPage = resolve(fileURLToPath(new URL('./index.html', import.meta.url)));
const authSource = resolve(root, 'hag_auth.js');
const apiUrl = process.env.HAG_RUN_LOCAL_API_URL || '';
const anonKey = process.env.HAG_RUN_LOCAL_ANON_KEY || '';
const allowed = new Set([
  '/hag_run_HAG.html', '/hag_run_medico.html', '/hag_run_engine.js',
  '/hag_run_policy.js', '/hag_run_store.js', '/hag_run_hag_os_bridge.js',
]);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(apiUrl) || !anonKey || /service[_-]?role/i.test(anonKey)) {
  throw new Error('O host HAG OS Dev aceita somente URL Supabase local e chave pública local.');
}

function localConfig() {
  return `window.SUPA_URL=${JSON.stringify(apiUrl)};window.SUPA_KEY=${JSON.stringify(anonKey)};` +
    `window.HAG_EXIGIR_LOGIN=true;window.HAG_CFG={SUPA_URL:${JSON.stringify(apiUrl)},SUPA_KEY:${JSON.stringify(anonKey)},EXIGIR_LOGIN:true};` +
    `window.HAG_RUN_CONFIG={url:${JSON.stringify(apiUrl)},anonKey:${JSON.stringify(anonKey)}};`;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405).end();
  let body;
  let target;
  if (url.pathname === '/' || url.pathname === '/index.html') {
    body = await readFile(hostPage);
    target = hostPage;
  } else if (url.pathname === '/hag-os-dev-config.js') {
    body = Buffer.from(localConfig());
    target = url.pathname;
  } else if (url.pathname === '/hag_auth.js') {
    body = await readFile(authSource);
    target = authSource;
  } else if (allowed.has(url.pathname)) {
    target = resolve(root, `.${url.pathname}`);
    if (!target.startsWith(root + sep)) return response.writeHead(403).end();
    body = await readFile(target);
    if (url.pathname === '/hag_run_HAG.html') {
      const html = body.toString('utf8').replace('</head>', '<script src="/hag-os-dev-config.js"></script></head>');
      body = Buffer.from(html);
    }
  } else {
    return response.writeHead(404).end('Not found');
  }
  response.writeHead(200, {
    'content-type': target === '/hag-os-dev-config.js' ? mime['.js'] : mime[extname(target)] || 'application/octet-stream',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  if (request.method === 'HEAD') return response.end();
  response.end(body);
});

const port = Number(process.env.HAG_RUN_DEV_PORT || 8787);
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`HAG OS Dev local: http://127.0.0.1:${port}/\n`);
  process.stdout.write('Somente loopback. O Supabase local continua ativo após Ctrl+C; use npm run dev:hag-os:stop para pará-lo.\n');
});
