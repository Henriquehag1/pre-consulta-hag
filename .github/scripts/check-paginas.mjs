// HAG_OS_CI_v1 (28/10/2026): checagem de integridade das paginas do HAG OS publicadas pelo main.
// Motivo: a protecao do main exige o check "Testes e integridade", mas o workflow que o produzia so
// existia no branch do HAG RUN; sem este arquivo nenhum PR do HAG OS conseguia ser aprovado.
// Autorizado pelo Dr. Henrique em 28/10/2026. Checa a sintaxe de todo <script> inline das paginas .html
// e dos .js da raiz. Sem rede, sem segredo.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..', '..');
const tmp = mkdtempSync(join(tmpdir(), 'hag-os-check-'));
let falhas = 0, total = 0;
const checa = (arq, rotulo) => { total++; const r = spawnSync(process.execPath, ['--check', arq], { encoding: 'utf8' });
  if (r.status !== 0) { falhas++; console.error(`FALHOU ${rotulo}\n${(r.stderr || r.stdout).slice(0, 800)}`); } };
try {
  for (const f of readdirSync(root).sort()) {
    if (f.endsWith('.js')) { checa(join(root, f), f); continue; }
    if (!f.endsWith('.html')) continue;
    const html = readFileSync(join(root, f), 'utf8');
    let i = 0;
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1];
      if (/\bsrc\s*=/i.test(attrs)) continue;
      const tipo = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [, ''])[1].toLowerCase();
      if (tipo && !/^(text\/javascript|application\/javascript|module)$/.test(tipo)) continue;
      const arq = join(tmp, `${f}.${++i}.${tipo === 'module' ? 'mjs' : 'js'}`);
      writeFileSync(arq, m[2]);
      checa(arq, `${f} (script ${i})`);
    }
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(`${total} scripts checados, ${falhas} com erro de sintaxe`);
process.exit(falhas ? 1 : 0);
