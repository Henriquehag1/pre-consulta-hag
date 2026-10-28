# HAG_RUN_INTEGRACAO_v1 (28/10/2026): integra o HAG RUN ao HAG Treino sem sistema paralelo.
# Painel do medico: aba "Corrida" no treino_painel_HAG.html (mesmo login HAGAuth), com vinculo
# medico-paciente pela RPC da 0003 e o painel clinico montado pelo bridge existente.
# App do paciente: card "Corrida" no treino_HAG.html, so para quem ja tem HAG RUN, pelo mesmo link.
# Uso: python3 scripts/patch_hag_run_integracao.py <raiz do repo>
import sys, os
R = sys.argv[1]
def patch(arq, trocas):
    p = os.path.join(R, arq); s = open(p, encoding="utf-8").read()
    for velho, novo, rot in trocas:
        c = s.count(velho)
        if c != 1: raise SystemExit(f"FALHOU [{arq} · {rot}]: {c} ocorrencias")
        s = s.replace(velho, novo)
    return p, s

saidas = []

# ---------- painel do medico ----------
saidas.append(patch("treino_painel_HAG.html", [
("""<script src="hag_auth.js?v=20260922-1750"></script>""",
"""<script src="hag_auth.js?v=20260922-1750"></script>
<script src="hag_run_hag_os_bridge.js"></script><!-- HAG_RUN_INTEGRACAO_v1: aba Corrida -->""", "bridge"),
("""    <button role="tab" aria-selected="false" data-v="exs">Exercícios e vídeos</button>""",
"""    <button role="tab" aria-selected="false" data-v="exs">Exercícios e vídeos</button>
    <button role="tab" aria-selected="false" data-v="run">Corrida</button>""", "aba"),
("""function render(){ if(E.aba==="pac") renderPaciente(); else if(E.aba==="mod") renderModelos(); else renderExs(); }""",
"""function render(){ if(E.aba!=="run" && runMount){ try{ runMount.destroy(); }catch(_){} runMount=null; }
  if(E.aba==="pac") renderPaciente(); else if(E.aba==="mod") renderModelos(); else if(E.aba==="run") renderCorrida(); else renderExs(); }
/* HAG_RUN_INTEGRACAO_v1 (28/10/2026): aba Corrida. O HAG RUN usa o mesmo login da equipe (HAGAuth) e o
   mesmo link pessoal do paciente. So medico cadastrado (hag_run_clinicians) ve as acoes; o vinculo com o
   paciente e feito aqui, com motivo, e auditado no banco. O painel clinico roda num iframe sem
   credenciais: o token fica neste host e o bridge so repassa as RPCs permitidas. */
let runMount=null, runSeq=0;
async function renderCorrida(){
  const minha=++runSeq;
  if(runMount){ try{ runMount.destroy(); }catch(_){} runMount=null; }
  const msg=E.msg?`<div class="msg ${E.msg.tipo==="ok"?"ok":"err"}">${esc(E.msg.texto)}</div>`:"";
  if(!E.pid){ main.innerHTML=`<section class="card"><h2>Corrida · HAG RUN</h2>${msg}<p class="note">Escolha o paciente na aba Paciente.</p></section>`; return; }
  const pac=(E.pacientes.find(x=>x.id===E.pid)||{}).nome||E.pid;
  main.innerHTML=`<section class="card"><h2>Corrida · HAG RUN</h2>${msg}<p><b>${esc(pac)}</b></p><p class="note" id="run-estado">Conferindo seu acesso…</p><div id="run-acoes"></div></section><div id="run-painel"></div>`;
  const est=document.getElementById("run-estado"), ac=document.getElementById("run-acoes");
  let me=null;
  try{ me=await rpc("hag_run_clinician_me",{}); }catch(e){ if(minha===runSeq) est.textContent="O HAG RUN ainda não está instalado neste banco ("+e.message+")."; return; }
  if(minha!==runSeq || E.aba!=="run") return;
  if(!me||!me.registered){ est.textContent="Seu login não está cadastrado como médico do HAG RUN. Avaliação, prescrição e suspensão de corrida ficam só com o médico."; return; }
  if(!E.P){ try{ E.P=await rpc("hag_treino_painel",{p_patient_id:E.pid}); }catch(_){} }
  const tok=E.P&&E.P.acesso&&E.P.acesso.token;
  const link=tok?new URL("hag_run_HAG.html?t="+tok,location.href).href:null;
  let vinc=true; try{ await rpc("hag_run_clinician_context",{p_patient_id:E.pid}); }catch(e){ vinc=false; }
  if(minha!==runSeq || E.aba!=="run") return;
  est.textContent = vinc ? "Paciente vinculado a você no HAG RUN." : "Este paciente ainda não está vinculado a você no HAG RUN. O vínculo libera a avaliação, a prescrição e a suspensão da corrida.";
  ac.innerHTML=(link?`<div class="linkbox" id="run-link">${esc(link)}</div><div class="row" style="margin-top:8px"><button class="btn small" data-a="runcopiar">Copiar link da corrida</button><span class="note">O paciente faz a avaliação por este link. É o mesmo link pessoal do treino.</span></div>`:`<p class="note">Gere o link do treino na aba Paciente. A corrida usa o mesmo link.</p>`)
    +(vinc?`<div class="row" style="margin-top:10px"><button class="btn small ghost" data-a="rundesv">Desvincular do HAG RUN</button></div>`
          :`<div class="row" style="margin-top:10px"><input id="run-motivo" maxlength="300" placeholder="Motivo do vínculo (vai para a auditoria)" style="flex:1 1 260px"><button class="btn small" data-a="runvinc">Vincular paciente</button></div>`);
  if(vinc) runMount=HAGRunHostBridge.mount(document.getElementById("run-painel"),{panelUrl:"hag_run_medico.html",patientId:()=>E.pid});
}""", "render + renderCorrida"),
("""  if(a==="copiar"){ const t=document.getElementById("link").textContent; return acao(async()=>{ await navigator.clipboard.writeText(t); },"Link copiado."); }""",
"""  if(a==="copiar"){ const t=document.getElementById("link").textContent; return acao(async()=>{ await navigator.clipboard.writeText(t); },"Link copiado."); }
  /* HAG_RUN_INTEGRACAO_v1 */
  if(a==="runcopiar"){ const t=document.getElementById("run-link").textContent; return acao(async()=>{ await navigator.clipboard.writeText(t); },"Link da corrida copiado."); }
  if(a==="runvinc"){ const m=(document.getElementById("run-motivo").value||"").trim(); if(m.length<3){ E.msg={tipo:"err",texto:"Escreva o motivo do vínculo."}; return render(); } return acao(async()=>{ await rpc("hag_run_clinician_link_patient",{p_patient_id:E.pid,p_reason:m}); },"Paciente vinculado ao HAG RUN."); }
  if(a==="rundesv") return acao(async()=>{ await rpc("hag_run_clinician_unlink_patient",{p_patient_id:E.pid,p_reason:"Desvínculo pelo painel do Treino"}); },"Paciente desvinculado do HAG RUN.");""", "acoes"),
]))

for p, s in saidas:
    open(p, "w", encoding="utf-8").write(s)
print("ok", [os.path.basename(p) for p, _ in saidas])
