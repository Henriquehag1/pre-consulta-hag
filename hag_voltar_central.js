/* HAG_VOLTAR_CENTRAL_v2 (11/11/2026). Quem abre Agendar, Cozinha, Treino ou Orientações pela central do
   paciente (?de=central) ganha um "‹ Central" fixo no topo: no app salvo na tela de início do iPhone não
   existe botão voltar do navegador. A central reabre sozinha com o link e a sessão guardados no aparelho. */
(function(){
  try{
    var q=new URLSearchParams(location.search), veio=q.get('de')==='central';
    try{ if(veio) sessionStorage.setItem('hag_de_central','1'); else if(sessionStorage.getItem('hag_de_central')==='1') veio=true; }catch(e){}
    if(!veio || document.getElementById('hagVoltarCentral')) return;
    var a=document.createElement('a'); a.id='hagVoltarCentral'; a.href='central_HAG.html'; a.textContent='‹ Central';
    a.setAttribute('aria-label','Voltar para a central do seu acompanhamento');
    /* v2: faixa no topo, no fluxo da página, e não flutuando: flutuando, cobria o nome HAG COZINHA e HAG TREINO. */
    a.style.cssText='display:inline-block;background:rgba(51,37,30,.92);color:#EEE7DC;font:500 13px/1 Jost,"Helvetica Neue",Arial,sans-serif;'
      +'letter-spacing:.08em;padding:9px 13px;border-radius:999px;text-decoration:none';
    var f=document.createElement('div'); f.id='hagVoltarFaixa';
    f.style.cssText='position:relative;z-index:99990;padding:calc(env(safe-area-inset-top, 0px) + 10px) 12px 4px;max-width:720px;margin:0 auto;box-sizing:border-box';
    f.appendChild(a);
    var b=document.body||document.documentElement; b.insertBefore(f, b.firstChild);
    /* HAG_BREVIDADE_v1: quem veio pela central já tem o ícone dela; o convite para salvar Treino ou Cozinha na tela sai. */
    var st=document.createElement('style'); st.textContent='.hagi{display:none!important}'; document.head.appendChild(st);
  }catch(e){}
})();
