# HAG_RUN_INTEGRACAO_v1 (28/10/2026), lado do paciente.
# treino_HAG.html: card "Corrida" na aba Programas, so para quem ja tem HAG RUN (avaliacao, decisao ou
# historico). Usa o mesmo link pessoal. Se o banco nao tiver o HAG RUN, a chamada falha calada e nada muda.
# hag_run_HAG.html: volta para o Treino com o mesmo link; orientacoes do medico aparecem sempre que existirem.
import sys, os
R = sys.argv[1]
def patch(arq, trocas):
    p = os.path.join(R, arq); s = open(p, encoding="utf-8").read()
    for velho, novo, rot in trocas:
        c = s.count(velho)
        if c != 1: raise SystemExit(f"FALHOU [{arq} · {rot}]: {c} ocorrencias")
        s = s.replace(velho, novo)
    open(p, "w", encoding="utf-8").write(s)

patch("treino_HAG.html", [
(""".step{display:flex;align-items:center;""",
""".runcard{display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:14px;padding:14px;margin:12px 0;background:var(--surface)}   /* HAG_RUN_INTEGRACAO_v1 */
.runcard .rt{flex:1}.runcard .rk{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}.runcard b{display:block;font-size:17px}
.runcard .pl{font-size:12px;font-weight:700;border-radius:99px;padding:3px 9px;background:var(--cream)}.runcard .pl.g{color:#2d7a3a}.runcard .pl.y{color:#8d6b33}.runcard .pl.r{color:#a33}
.step{display:flex;align-items:center;""", "css"),
("""function renderLivre(){
  /* HAG_TREINO_CATALOGO_v1""",
"""/* HAG_RUN_INTEGRACAO_v1 (28/10/2026): a corrida guiada (HAG RUN) entra como card no alto dos Programas,
   so para quem ja tem HAG RUN. O estado vem do servidor pelo mesmo link; nada e gravado aqui. */
let RUN=null;
function carregarRun(){
  if(VER || !TOKEN) return;
  rpc("hag_run_patient_context_v2",{p_token:TOKEN}).then(r=>{
    RUN=(r && r.ok && (r.medical_authorization || r.pending_review || r.program || (Array.isArray(r.history)&&r.history.length))) ? r : null;
    if(RUN && tabLivre) tabLivre.hidden=false;
    if(!vLivre.hidden) renderLivre();
  }).catch(()=>{ RUN=null; });
}
function runCardHTML(){
  if(!RUN) return "";
  const d=RUN.medical_authorization && RUN.medical_authorization.decision;
  const st = RUN.pending_review ? ["Em avaliação médica","y"]
    : (d==="released"||d==="released_with_restrictions") ? ["Liberada","g"]
    : d==="suspended" ? ["Suspensa","r"] : ["Em avaliação","y"];
  return `<a class="runcard" href="hag_run_HAG.html?t=${encodeURIComponent(TOKEN)}"><span class="rt"><span class="rk">Corrida guiada</span><b>Rumo aos 5 km</b></span><span class="pl ${st[1]}">${st[0]}</span><span aria-hidden="true">›</span></a>`;
}
function renderLivre(){
  renderLivreBase();
  if(RUN && !(catAberto && cats().some(c=>c.id===catAberto&&c.lib))){ if(tabLivre) tabLivre.hidden=false; vLivre.insertAdjacentHTML("afterbegin", runCardHTML()); }
}
function renderLivreBase(){
  /* HAG_TREINO_CATALOGO_v1""", "renderLivre com card"),
("""enviarFila().then(sent=>{ if(!sent) carregar(); });
})();""",
"""enviarFila().then(sent=>{ if(!sent) carregar(); });
carregarRun();   /* HAG_RUN_INTEGRACAO_v1 */
})();""", "boot"),
])

patch("hag_run_HAG.html", [
("""<div class="brand">HAG TREINO · CORRIDA</div>""",
"""<div class="brand"><a id="voltaTreino" href="treino_HAG.html" style="color:inherit;text-decoration:none">‹ TREINO</a> · HAG TREINO · CORRIDA</div>""", "volta"),
("""  const linkToken=new URLSearchParams(location.search).get('t');""",
"""  const linkToken=new URLSearchParams(location.search).get('t');
  {const vt=document.getElementById('voltaTreino');if(vt&&/^[a-f0-9]{24,64}$/i.test(linkToken||''))vt.href='treino_HAG.html?t='+encodeURIComponent(linkToken);} /* HAG_RUN_INTEGRACAO_v1 */""", "volta com token"),
("""authorization.decision==='released_with_restrictions')html+=""",
"""(authorization.decision==='released_with_restrictions'||authorization.scope?.patient_instructions))html+=""", "orientacoes sempre que houver"),
])
print("ok")
