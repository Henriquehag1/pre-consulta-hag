// HAG_COZINHA_TESTES_v1 (29/10/2026). Bateria permanente da Cozinha HAG, rodada no CI ("Testes e integridade").
// Pedido do Dr. Henrique depois da auditoria da outra IA: os testes antigos esperavam a coleção pública de 02/10.
// Banco SIMULADO: nenhuma chamada sai para o Supabase de verdade, e as receitas são fictícias (nada do acervo real).
// Uso: node tests/cozinha/teste_cozinha.mjs   (precisa do pacote playwright e do Chromium)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const SUPA = 'https://yutcnphwovqeiwcwzzhs.supabase.co';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = createServer(async (q, r) => {
  try { const p = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = join(RAIZ, p);
    if (!f.startsWith(RAIZ)) throw 0; const b = await readFile(f); r.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); r.end(b);
  } catch (e) { r.writeHead(404); r.end('nao'); }
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';

// ── dados fictícios ──────────────────────────────────────────────────────────────────────────────────────────
const nut = (k, p) => ({ kcal: { v: k, f: 'TACO' }, ptn: { v: p, f: 'TACO', vd: 40 }, cho: { v: 20, f: 'TACO' }, lip: { v: 8, f: 'TACO' } });
const ING_A = [{ k: 'aveia', nome: 'Aveia em flocos', g: 40, med: '4 colheres de sopa', sec: 'Mercearia' }, { k: 'ovo', nome: 'Ovo', g: 100, med: '2 unidades', sec: 'Ovos e laticínios' }];
const REC_A = { id: 'rec-a', sit: 'manha', nome: 'Receita teste A', resumo: 'Resumo A.', tempo: 10, rende: 2, porcao: '1 prato', peso: 150, ing: ING_A, tempero: ['sal'],
  preparo: ['Misture tudo.', 'Leve à frigideira por 2 minutos de cada lado.'], truque: 'Fogo baixo.', guardar: 'Congela por 30 dias.', aviso: null, n: nut(300, 20), dest: [],
  var: [{ nome: 'Sem aveia', ideia: 'Troca a aveia pela banana.', peso: 150, tira: ['Aveia em flocos'], poe: [{ k: 'banana', nome: 'Banana-prata', g: 70, med: '1', sec: 'Hortifrúti' }],
          ing: [ING_A[1], { k: 'banana', nome: 'Banana-prata', g: 70, med: '1', sec: 'Hortifrúti' }], n: nut(250, 14), dest: [] }] };
const SEL_A = { contem: ['gluten', 'ovo'], facil: true, congela: true, var: [{ contem: ['ovo'] }] };
const REC_B = { ...REC_A, id: 'rec-b', sit: 'tarde', nome: 'Receita teste B', var: [] };
const GUIA_A = { id: 'guia-a', grupo: 'fora', nome: 'Guia teste A', resumo: 'Resumo do guia.', blocos: [{ t: 'Melhor escolha', itens: ['Item 1'] }] };
const META = { situacoes: [{ id: 'manha', nome: 'Acordei sem tempo', frase: '.' }, { id: 'tarde', nome: 'Cheguei tarde', frase: '.' }], grupos_guia: [{ id: 'fora', nome: 'Comer fora', frase: '.' }],
  rotulo: { kcal: { nome: 'Energia', un: 'kcal' }, ptn: { nome: 'Proteína', un: 'g' }, cho: { nome: 'Carboidrato', un: 'g' }, lip: { nome: 'Gordura', un: 'g' } }, ordem: [],
  fontes: { TACO: 'TACO', USDA: 'USDA', VDR: 'IN 75/2020' } };
const ITENS = { 'rec-a': { tipo: 'receita', grupo: 'manha', dados: REC_A, selos: SEL_A }, 'rec-b': { tipo: 'receita', grupo: 'tarde', dados: REC_B, selos: { contem: [] } },
  'guia-a': { tipo: 'guia', grupo: 'fora', dados: GUIA_A, selos: null }, 'rec-z': { tipo: 'receita', grupo: 'manha', dados: { ...REC_A, id: 'rec-z', nome: 'Não liberada' }, selos: null } };
const TOK_A = 'TOK_A_valido_000000000000000000', TOK_REV = 'TOK_REVOGADO_00000000000000000';
const TOK_ORD = 'TOK_ORDEM_00000000000000000000';
const LIB = { [TOK_A]: ['rec-a', 'rec-b', 'guia-a'], [TOK_ORD]: ['rec-b', 'rec-a'] };
const resumo = id => { const d = ITENS[id].dados; return ITENS[id].tipo === 'receita' ? { nome: d.nome, resumo: d.resumo, tempo: d.tempo, kcal: d.n.kcal.v, ptn: d.n.ptn.v, nvar: d.var.length } : { nome: d.nome, resumo: d.resumo }; };

let falhas = 0, total = 0;
const T = (nome, ok, extra) => { total++; if (!ok) falhas++; console.log((ok ? 'ok    ' : 'FALHOU') + ' ' + nome + (ok || !extra ? '' : '  (' + extra + ')')); };

const browser = await chromium.launch();
async function pagina(url, opt = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...(opt.ctx || {}) });
  const p = await ctx.newPage(); const st = { calls: [], erros: [], offline: false, retirado: false, eventos: [] };
  p.on('pageerror', e => st.erros.push(e.message));
  await ctx.route('**/fonts.googleapis.com/**', r => r.abort()); await ctx.route('**/fonts.gstatic.com/**', r => r.abort());
  await ctx.route(SUPA + '/rest/v1/rpc/*', async r => {
    const fn = r.request().url().split('/rpc/')[1]; const a = JSON.parse(r.request().postData() || '{}'); st.calls.push(fn);
    const json = b => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
    const lib = LIB[a.p_token];
    if (fn === 'hag_cozinha_colecao' || fn === 'hag_cozinha_colecao_ver') {
      if (!lib) return json({ paciente: false, meta: null, itens: [], para_voce: [] });
      return json({ paciente: true, meta: META, itens: lib.map(id => ({ id, tipo: ITENS[id].tipo, grupo: ITENS[id].grupo, acesso: 'paciente', trancado: false, foto: null, r: resumo(id), s: ITENS[id].selos })),
        para_voce: lib.map(id => ({ id, motivo: 'Porque ' + id, consulta: '2026-10-20' })) });
    }
    if (fn === 'hag_cozinha_item' || fn === 'hag_cozinha_item_ver') {
      if (!lib) return json({ erro: 'so_paciente' });
      if (!lib.includes(a.p_id) || (st.retirado && a.p_id === 'rec-b')) return json({ erro: 'nao_liberado' });
      const i = ITENS[a.p_id]; return json({ id: a.p_id, tipo: i.tipo, grupo: i.grupo, acesso: 'paciente', foto: null, dados: i.dados, selos: i.selos });
    }
    if (fn === 'hag_cozinha_evento') { if (st.offline) return r.abort(); st.eventos.push(a); return json({ ok: true }); }
    if (fn.startsWith('hag_orientacoes_paciente')) return json({ ok: true, itens: [] });
    return json({ erro: 'nao_simulado' });
  });
  if (opt.rest) await ctx.route(u => u.href.startsWith(SUPA + '/rest/v1/') && !u.href.includes('/rpc/'), opt.rest);
  if (opt.auth != null) await ctx.route('**/hag_auth.js*', r => r.fulfill({ contentType: 'text/javascript',
    body: `window.SUPA_URL='${SUPA}';window.SUPA_KEY='chave_publica_teste';window.HAGAuth={valid:function(){return ${opt.auth}},token:function(){return 'token_equipe_teste'}};` }));
  await p.goto(BASE + url); await p.waitForTimeout(opt.espera || 900);
  return { p, st, ctx };
}
const txt = async p => (await p.locator('#app').innerText());

// 1 a 3: sem link, link inválido e link revogado não mostram conteúdo
{ const { p, st, ctx } = await pagina('cozinha_HAG.html');
  T('1. sem link: só a apresentação', /link pessoal/.test(await txt(p)) && !(await p.locator('.linha').count()));
  T('1. sem link: nenhuma chamada ao banco', st.calls.length === 0, st.calls.join(','));
  T('1. sem link: zero erro de página', !st.erros.length, st.erros.join(' | ')); await ctx.close(); }
{ const { p, ctx } = await pagina('cozinha_HAG.html?t=TOK_errado_0000000000000000');
  T('2. link inválido: aviso e nada da coleção', /não está mais ativo/.test(await txt(p)) && !(await p.locator('.linha').count())); await ctx.close(); }
{ const { p, ctx } = await pagina('cozinha_HAG.html?t=' + TOK_REV);
  T('3. link revogado: aviso e nada da coleção', /não está mais ativo/.test(await txt(p)) && !(await p.locator('.linha').count())); await ctx.close(); }

// 4 a 8: paciente com seleção
{ const { p, st, ctx } = await pagina('cozinha_HAG.html?t=' + TOK_A);
  T('4. seleção: só as 2 receitas liberadas na lista', (await p.locator('.linha').count()) === 2);
  T('4. seleção: o porquê aparece', /Porque rec-a/.test(await txt(p)));
  T('4. selos no cartão (Fácil, Congela)', /Fácil · Congela/.test(await txt(p)));
  await p.evaluate(() => { location.hash = 'rec-z'; }); await p.reload(); await p.waitForTimeout(700);
  T('5. receita não liberada pelo endereço não abre', !(await p.locator('.ficha').count()));
  await p.click('[data-abrir="rec-a"]'); await p.waitForTimeout(500);
  T('6. ficha abre', (await p.locator('.ficha h1').textContent()) === 'Receita teste A');
  T('6. alergênicos da base', /Contém:\s*glúten, ovo/.test(await txt(p)));
  T('6. evento "abriu" enviado', st.eventos.some(e => e.p_tipo === 'abriu' && e.p_chave === 'rec-a'));
  const g1 = await p.locator('.ing li b').first().innerText();
  await p.click('#mais'); await p.waitForTimeout(150);
  const g2 = await p.locator('.ing li b').first().innerText();
  T('7. porções: 2 para 3 aumenta os gramas', g1 === '40 g' && g2 === '60 g', g1 + ' -> ' + g2);
  await p.click('[data-vari="0"]'); await p.waitForTimeout(150);
  T('7. versão troca os ingredientes', /Banana-prata/.test(await txt(p)) && !/Aveia em flocos/.test(await p.locator('.ing').innerText()));
  T('7. alergênicos mudam com a versão', /Contém:\s*ovo\./.test(await txt(p)));
  await p.click('#add'); await p.waitForTimeout(150); await p.click('#voltar'); await p.waitForTimeout(150);
  await p.click('#nav [data-t="lista"]'); await p.waitForTimeout(200);
  const lt = await txt(p);
  T('7. lista de compras soma a versão e a porção', /Banana-prata/.test(lt) && /Ovo/.test(lt) && /150 g/.test(lt), lt.slice(0, 200));
  st.retirado = true; await p.click('#nav [data-t="rec"]'); await p.waitForTimeout(150);
  await p.click('[data-abrir="rec-b"]'); await p.waitForTimeout(500);
  T('8. item retirado depois de carregar: não abre e avisa', !(await p.locator('.ficha').count()) && /não está liberado/.test(await p.locator('#toast').innerText()));
  T('4-8. zero erro de página', !st.erros.length, st.erros.join(' | ')); await ctx.close(); }

// 9: o médico vendo pelo painel não grava nada
{ const { p, st, ctx } = await pagina('cozinha_HAG.html?t=' + TOK_A + '&ver=1');
  await p.click('[data-abrir="rec-a"]'); await p.waitForTimeout(500);
  T('9. ver: índice e ficha pelas funções _ver', st.calls.includes('hag_cozinha_colecao_ver') && st.calls.includes('hag_cozinha_item_ver') && !st.calls.includes('hag_cozinha_colecao') && !st.calls.includes('hag_cozinha_item'), st.calls.join(','));
  T('9. ver: nenhum evento enviado', !st.calls.includes('hag_cozinha_evento'));
  T('9. ver: nada guardado no aparelho', (await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('hagcozinha')).length)) === 0);
  T('9. ver: faixa de visualização', /Visualização do médico/.test(await p.locator('body').innerText())); await ctx.close(); }

// 10: vitrine sem login da equipe
{ const { p, st, ctx } = await pagina('cozinha_HAG.html?vitrine=1');
  T('10. vitrine sem login: explica e não chama o banco', /Abra pelo painel/.test(await txt(p)) && st.calls.length === 0, st.calls.join(',')); await ctx.close(); }

// 11: sem internet, o evento espera e sai depois
{ const a = await pagina('cozinha_HAG.html?t=' + TOK_A); a.st.offline = true;
  await a.p.click('[data-abrir="rec-a"]'); await a.p.waitForTimeout(600);
  const pend = await a.p.evaluate(() => (JSON.parse(localStorage.getItem('hagcozinha.ev.pend') || '[]')).length);
  T('11. sem internet: evento fica na fila do aparelho', pend >= 1, 'fila ' + pend);
  a.st.offline = false; await a.p.reload(); await a.p.waitForTimeout(900);
  const pend2 = await a.p.evaluate(() => (JSON.parse(localStorage.getItem('hagcozinha.ev.pend') || '[]')).length);
  T('11. com internet de volta: a fila esvazia e o evento chega', pend2 === 0 && a.st.eventos.some(e => e.p_tipo === 'abriu'), 'fila ' + pend2); await a.ctx.close(); }

// 12 e 13: painel
{ const { p, ctx } = await pagina('cozinha_painel_HAG.html', { auth: false, espera: 4000 });
  T('12. painel sem login: acesso restrito', /Acesso restrito/.test(await p.locator('body').innerText())); await ctx.close(); }
{ const tab = { cozinha_itens: [{ id: 'rec-a', tipo: 'receita', grupo: 'manha', ordem: 1, acesso: 'paciente', aprovado: true, resumo: resumo('rec-a'), foto_url: null, selos: SEL_A }],
    cozinha_colecao_meta: [{ dados: META }], patients: [{ id: 'p_1', nome: 'Paciente Um', status: 'ativo', interno: false }, { id: 'p_2', nome: 'Paciente Dois', status: 'ativo', interno: false }, { id: 'p_interno', nome: 'Interno', status: 'ativo', interno: true }],
    treino_programas: [], cozinha_selecao: [{ patient_id: 'p_1', item_id: 'rec-a', ativo: true }, { patient_id: 'p_2', item_id: 'rec-a', ativo: true }, { patient_id: 'p_interno', item_id: 'rec-a', ativo: true }],
    cozinha_eventos: [{ patient_id: 'p_1', data: '2026-10-20', hora: '2026-10-20T12:00:00Z', tipo: 'abriu', chave: 'rec-a' }, { patient_id: 'p_1', data: '2026-10-21', hora: '2026-10-21T12:00:00Z', tipo: 'cozinhar', chave: 'rec-a' }],
    checkins: [{ patient_id: 'p_2', data_envio: new Date().toISOString().slice(0, 10), cozinha_uso: 'Não recebi o link da Cozinha' }] };
  const rest = r => { const u = new URL(r.request().url()); const t = u.pathname.split('/rest/v1/')[1]; return r.fulfill({ contentType: 'application/json', body: JSON.stringify(tab[t] || []) }); };
  const { p, st, ctx } = await pagina('cozinha_painel_HAG.html', { auth: true, rest, espera: 2500 });
  const b = await p.locator('body').innerText();
  T('13. painel: cartão Uso da Cozinha', /Uso da Cozinha/i.test(b));
  const kp = await p.locator('.card:has(h3:text("Uso da Cozinha")) .kpi b').allInnerTexts();
  T('13. funil: 2 liberados (sem o interno), 1 abriu, 1 cozinhar, 0 fiz, 1 respondeu', kp.join(',') === '2,1,1,0,1', kp.join(','));
  T('13. a resposta do check-in aparece por paciente', /Não recebi o link da Cozinha/.test(b));
  T('13. selos na lista do passo 2', /contém glúten, ovo/.test(b));
  T('12-13. zero erro de página', !st.erros.length, st.erros.join(' | ')); await ctx.close(); }

// 14: a pergunta da Cozinha no check-in semanal
{ const { p, st, ctx } = await pagina('form_checkin_semanal_HAG.html', { espera: 1200 });
  const n = await p.locator('#r_cozinha .radio-row').count();
  await p.locator('#r_cozinha .radio-row').nth(3).click();
  const v = await p.evaluate(() => typeof _radioVal === 'function' ? _radioVal('r_cozinha') : '(sem _radioVal)');
  T('14. check-in: pergunta com 4 opções', n === 4, String(n));
  T('14. check-in: a escolha vira o valor salvo', v === 'Não recebi o link da Cozinha', v);
  T('14. check-in: zero erro de página', !st.erros.length, st.erros.join(' | ')); await ctx.close(); }

// 15: filtros na ordem das situações do meta (HAG_COZINHA_ORDEM_DIFICULDADE_v1), não na ordem em que o Dr. liberou
{ const { p, st, ctx } = await pagina('cozinha_HAG.html?t=' + TOK_ORD);
  const ch = (await p.locator('.chip').allTextContents()).map(x => x.replace(/\d+$/, ''));
  T('15. filtros seguem a ordem do meta (manhã antes de tarde), mesmo liberado ao contrário', ch.join('|') === 'Todas|Café em 10 min|Jantar rápido', ch.join('|'));
  T('15. zero erro de página', !st.erros.length, st.erros.join(' | ')); await ctx.close(); }

await browser.close(); srv.close();
console.log(`\n${total - falhas} de ${total} passaram`);
process.exit(falhas ? 1 : 0);
