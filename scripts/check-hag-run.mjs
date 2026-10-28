import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const htmlPath = join(root, 'hag_run_HAG.html');
const html = readFileSync(htmlPath, 'utf8');
const sources = ['hag_run_engine.js', 'hag_run_store.js', 'hag_run_policy.js', 'hag_run_hag_os_bridge.js'];

function checkJavaScript(file) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

for (const source of sources) {
  const path = join(root, source);
  if (!existsSync(path)) throw new Error(`Arquivo referenciado ausente: ${source}`);
  checkJavaScript(path);
}
checkJavaScript(join(root, 'tests/ui/hag_run_patient_supabase_e2e.test.js'));
checkJavaScript(join(root, 'tests/ui/hag_run_hag_os_local_e2e.test.js'));

const references = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
for (const reference of references) {
  if (/^(?:https?:)?\/\//i.test(reference)) continue;
  if (!existsSync(join(root, reference))) throw new Error(`Script HTML ausente: ${reference}`);
}
for (const source of ['hag_run_medico.html']) {
  const panelPath = join(root, source);
  if (!existsSync(panelPath)) throw new Error(`Arquivo referenciado ausente: ${source}`);
  const panel = readFileSync(panelPath, 'utf8');
  for (const reference of [...panel.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1])) {
    if (/^(?:https?:)?\/\//i.test(reference)) continue;
    if (!existsSync(join(root, reference))) throw new Error(`Script do painel ausente: ${reference}`);
  }
}

const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (inlineScripts.length !== 1) throw new Error(`Esperado um script inline na página, encontrado: ${inlineScripts.length}`);
const panelHtml = readFileSync(join(root, 'hag_run_medico.html'), 'utf8');
const panelInlineScripts = [...panelHtml.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (panelInlineScripts.length !== 1) throw new Error(`Esperado um script inline no painel, encontrado: ${panelInlineScripts.length}`);
const tempDir = mkdtempSync(join(tmpdir(), 'hag-run-check-'));
try {
  for (const [name, source] of [['patient', inlineScripts[0][1]], ['clinician', panelInlineScripts[0][1]]]) {
    const inlinePath = join(tempDir, `hag-run-${name}-inline.js`);
    writeFileSync(inlinePath, source);
    checkJavaScript(inlinePath);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

if (/\bon[a-z]+\s*=/i.test(html)) throw new Error('A página HAG RUN não deve usar handlers inline de eventos.');
if (/\bon[a-z]+\s*=/i.test(panelHtml)) throw new Error('O painel HAG RUN não deve usar handlers inline de eventos.');
if (/(?:sb_secret_[a-z0-9_-]{20,}|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^$])/i.test(html)) {
  throw new Error('Possível chave Supabase privada encontrada no HTML.');
}

console.log(`Integridade HAG RUN aprovada: ${sources.length + 2} arquivos JavaScript, ${references.length} scripts locais e scripts inline.`);
