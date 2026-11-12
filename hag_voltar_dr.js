/* HAG_VOLTAR_DR_v1 (12/11/2026). Pedido do Dr.: abriu o painel do Treino (ou da Cozinha, ou o Tarefas) pelo HAG Dr e
   teve de fechar o app para voltar: no app salvo na tela de início do iPhone não existe o voltar do navegador.
   Quem chega com ?de=dr ganha um "‹ HAG Dr" no topo, que volta para o app com a ficha do paciente aberta
   (o HAG Dr guarda isso no sessionStorage). Vale enquanto ele navega dentro da página aberta. */
(function(){
  try{
    var q=new URLSearchParams(location.search), veio=q.get('de')==='dr';
    try{ if(veio) sessionStorage.setItem('hag_de_dr','1'); else if(sessionStorage.getItem('hag_de_dr')==='1') veio=true; }catch(e){}
    if(!veio || document.getElementById('hagVoltarDr')) return;
    var a=document.createElement('a'); a.id='hagVoltarDr'; a.href='hag_dr_HAG.html'; a.textContent='\u2039 HAG Dr';
    a.setAttribute('aria-label','Voltar para o HAG Dr');
    a.onclick=function(){ try{ sessionStorage.removeItem('hag_de_dr'); }catch(e){} };
    a.style.cssText='display:inline-block;background:rgba(51,37,30,.92);color:#EEE7DC;font:500 13px/1 Jost,"Helvetica Neue",Arial,sans-serif;'
      +'letter-spacing:.08em;padding:9px 13px;border-radius:999px;text-decoration:none';
    var f=document.createElement('div'); f.id='hagVoltarDrFaixa';
    f.style.cssText='position:relative;z-index:99990;padding:calc(env(safe-area-inset-top, 0px) + 10px) 12px 4px;max-width:960px;margin:0 auto;box-sizing:border-box';
    f.appendChild(a);
    var b=document.body||document.documentElement; b.insertBefore(f, b.firstChild);
  }catch(e){}
})();
