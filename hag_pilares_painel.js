/* HAG_TELAS_MARCA_2026_v1 (10/11/2026): cores, fontes e assinatura da marca Henrique Alves */
/* HAG_PILARES_PAINEL_v1 ───────────────────────────────────────────────────────
   06/11/2026 · Os quatro pilares (dieta, suplemento, medicacao, exercicio) como
   modulo proprio, para a pagina Briefings do dia.

   PEDIDO: "nao encontrei no briefing a parte dos 4 pilares de cada paciente". O
   painel existia desde 21/09 (HAG_PAINEL_PILARES_v1), mas so como aba do painel
   lateral do consulta_motor_HAG.html. A pagina de briefings nunca o mostrou.

   O QUE E: o MESMO desenho e a MESMA regra do pilRender() do motor, portados para
   ca sem mudar o que se mostra. Sem IA, sem gastar token: tudo vem pronto da RPC
   hag_painel_pilares (so authenticated). Os avisos saem de catalogo_regras_pilares;
   o painel mostra, nao sugere conduta.

   PENDENTE (registrado no projeto): o motor ainda tem a copia propria (pilRender).
   O certo e o motor passar a usar este modulo, como ja faz com hag_briefing_cards.js.
   Nao foi feito agora para nao mexer no arquivo do motor sem teste dentro dele.

   v2.1 (06/11/2026, pedido do Dr.: os 4 pilares tambem no HAG Dr, no celular).
   - ESTE ARQUIVO EXISTE EM DOIS LUGARES DE PROPOSITO, identicos byte a byte:
     HAG_Consultas (briefings_HAG.html) e o repositorio publicado (hag_dr_HAG.html).
     Mudou num, copie para o outro e confira o md5; o hag_checa_duplicados.py
     confere. Por estar publicado: nada de nome de paciente, preco ou dado aqui;
     os dados so chegam pela RPC, que exige login.
   - Tema escuro OPCIONAL pela classe "pil-auto" junto de "pil-x" (o render
     aceita render(dados, {escuro:true})). Sem isso nada muda no Mac.
   - Container de ate 520 px: tabelas rolam de lado em vez de estourar, letra e
     alvos de toque um pouco maiores.

   v2.2 (07/11/2026, HAG_PILARES_IA_v1). Pedido do Dr.: "em cada pilar ter a interpretacao
   de IA do caso completo ... o que pode ser feito e o que e mais recomendado" e, em renovacao
   (penultima e fechamento), "qual o produto mais indicado". A analise e gerada no Mac
   (hag_pilares_ia.py, credito do Max) na vespera e pelo botao daqui, e fica em public.pilares_ia
   (leitura so com login). Este modulo so a desenha: nada de criterio clinico escrito aqui.
   - carregarTudo(url, chave, pid, data): painel + analise de IA juntos.
   - render(dados, {pid, data, escuro}) desenha a analise em cada pilar e o cartao de renovacao.
   - config({url, chave, redesenhar}): o botao "Gerar/Atualizar analise" pede ao Mac pela fila
     briefing_pedidos (tipo pilares_ia), acompanha e chama redesenhar() a cada passo.

   USO:
     HAGPilares.injetar();                       // uma vez
     HAGPilares.carregar(url, chave, pid)        // Promise -> {ok, dados|motivo}
     alvo.innerHTML = HAGPilares.render(dados);
--------------------------------------------------------------------------- */
(function (raiz) {
  'use strict';
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v){ var n=parseFloat(String(v==null?'':v).replace(',','.')); return isFinite(n)?n:null; }
  function fmt(n,dec){ if(n==null) return '—'; return (Math.round(n*Math.pow(10,dec))/Math.pow(10,dec)).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec}); }
  function vv(n){ return n==null?'—':n.toLocaleString('pt-BR',{maximumFractionDigits:2}); }
  function delta(a,b,dec){ if(a==null||b==null) return '—'; var d=b-a; return (d>0?'+':'')+fmt(d,dec); }
  function data(iso){ var x=String(iso||'').slice(0,10).split('-'); return x.length===3?(x[2]+'/'+x[1]+'/'+x[0].slice(2)):''; }
  function dose(s){ return String(s||'').toLowerCase().replace(/\s+/g,'').replace(',','.'); }

  function carregar(url, chave, pid){
    if(!pid) return Promise.resolve({ok:false, motivo:'Paciente sem identificação.'});
    return fetch(url+'/rest/v1/rpc/hag_painel_pilares',{method:'POST',
      headers:{'apikey':chave,'Authorization':'Bearer '+chave,'Content-Type':'application/json'},
      body:JSON.stringify({p_patient_id:pid})})
    .then(function(r){
      if(!r.ok) return {ok:false, motivo:'O banco recusou o painel (HTTP '+r.status+', paciente '+pid+'). Quase sempre é a sessão vencida: entre de novo.'};
      return r.json().then(function(d){
        if(!d || d.ok===false) return {ok:false, motivo:'O painel não veio: '+((d&&d.erro)||'resposta vazia')+' (paciente '+pid+').'};
        return {ok:true, dados:d};
      });
    })
    .catch(function(e){ return {ok:false, motivo:'Falha ao buscar o painel: '+((e&&e.message)||e)+'. Confira a conexão.'}; });
  }

  /* ── HAG_PILARES_IA_v1: analise de IA guardada por paciente, e o pedido ao Mac ── */
  var IAS={}, IAEST={}, CFG={};
  function hdr(chave){ return {'apikey':chave,'Authorization':'Bearer '+chave,'Content-Type':'application/json'}; }
  function carregarIA(url, chave, pid, dia){
    var q='/rest/v1/pilares_ia?select=*&patient_id=eq.'+encodeURIComponent(pid)+(dia?'&data_consulta=lte.'+encodeURIComponent(dia):'')+'&order=data_consulta.desc&limit=1';
    return fetch(url+q,{headers:hdr(chave)}).then(function(r){ return r.ok?r.json():[]; })
      .then(function(a){ IAS[pid]=(a&&a[0])||null; return IAS[pid]; })
      .catch(function(){ IAS[pid]=IAS[pid]||null; return IAS[pid]; });
  }
  function carregarTudo(url, chave, pid, dia){
    return Promise.all([carregar(url, chave, pid), carregarIA(url, chave, pid, dia)]).then(function(x){ return x[0]; });
  }
  function config(c){ CFG=c||{}; }
  function redesenha(){ try{ if(CFG.redesenhar) CFG.redesenhar(); }catch(e){} }
  function pedirIA(pid, dia){
    if(!CFG.url||!CFG.chave){ IAEST[pid]={erro:'Página sem configuração para pedir a análise.'}; redesenha(); return; }
    if(IAEST[pid]&&IAEST[pid].ocupado) return;
    IAEST[pid]={ocupado:true, msg:'Pedido enviado. O Mac começa em até 1 minuto; ele precisa estar ligado.'}; redesenha();
    fetch(CFG.url+'/rest/v1/briefing_pedidos',{method:'POST',headers:Object.assign(hdr(CFG.chave),{Prefer:'return=representation'}),
      body:JSON.stringify({patient_id:pid, data_consulta:dia, tipo:'pilares_ia'})})
    .then(function(r){ if(!r.ok) return r.text().then(function(t){ throw new Error('HTTP '+r.status+' '+t.slice(0,120)); }); return r.json(); })
    .then(function(a){
      var id=a&&a[0]&&a[0].id; if(!id) throw new Error('o pedido não voltou do banco');
      var t0=Date.now();
      (function olha(){
        if(Date.now()-t0>7*60000){ IAEST[pid]={erro:'Ainda não terminou. O pedido segue na fila; abra de novo daqui a pouco.'}; redesenha(); return; }
        setTimeout(function(){
          fetch(CFG.url+'/rest/v1/briefing_pedidos?select=status,resumo,erro&id=eq.'+id,{headers:hdr(CFG.chave)})
          .then(function(r){ return r.json(); }).then(function(x){
            var st=(x&&x[0])||{};
            if(st.status==='feito'){ carregarIA(CFG.url, CFG.chave, pid, dia).then(function(){ IAEST[pid]=null; redesenha(); }); return; }
            if(st.status==='erro'){ IAEST[pid]={erro:'Não gerou: '+(st.erro||'erro sem detalhe')}; redesenha(); return; }
            IAEST[pid]={ocupado:true, msg: st.status==='processando' ? 'A IA está lendo o caso completo (cerca de 1 minuto)…'
              : (Date.now()-t0>90000 ? 'O Mac ainda não pegou o pedido. Ele precisa estar ligado e acordado.' : IAEST[pid].msg)};
            redesenha(); olha();
          }).catch(olha);
        },4000);
      })();
    })
    .catch(function(e){ IAEST[pid]={erro:'Não foi possível pedir: '+((e&&e.message)||e)}; redesenha(); });
  }
  function hora(iso){ var d=new Date(iso); return isNaN(d)?'':(('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+' '+('0'+d.getHours()).slice(-2)+'h'+('0'+d.getMinutes()).slice(-2)); }
  function blocoIA(x){
    if(!x||!x.leitura) return '';
    var ops=(x.opcoes||[]), mr=String(x.mais_recomendado||'');
    var h='<div class="pil-ia"><div class="pil-ia-t">✦ Leitura da IA</div><div class="pil-ia-l">'+esc(x.leitura)+'</div>';
    if(mr) h+='<div class="pil-ia-mr"><em>Mais recomendado</em><b>'+esc(mr)+'</b>'+(x.por_que?'<span>'+esc(x.por_que)+'</span>':'')+'</div>';
    var outras=ops.filter(function(o){ return String(o.o_que||'')!==mr; });
    if(outras.length) h+='<details class="pil-ia-op"><summary>Outras opções ('+outras.length+')</summary>'+outras.map(function(o){
      return '<div class="pil-ia-o"><b>'+esc(o.o_que)+'</b>'+(o.quando?'<span>'+esc(o.quando)+'</span>':'')+'</div>'; }).join('')+'</details>';
    if(x.vigiar) h+='<div class="pil-ia-v">Vigiar: '+esc(x.vigiar)+'</div>';
    return h+'</div>';
  }
  var ROT_MOMENTO={fechamento:'fechamento do ciclo', penultima:'conversa de renovação'};
  function topoIA(op){
    var pid=op&&op.pid; if(!pid) return '';
    var ia=IAS[pid], est=IAEST[pid], c=ia&&ia.conteudo, h='';
    var botao='<button type="button" class="pil-ia-bt" data-pil-ia="'+esc(pid)+'" data-pil-dia="'+esc(op.data||'')+'"'+(est&&est.ocupado?' disabled':'')+'>'
      +(est&&est.ocupado?'Gerando…':(c?'Atualizar análise':'Gerar análise de IA'))+'</button>';
    h+='<div class="pil-ia-cab"><div><b>✦ Análise de IA do caso</b><span>'
      +(c?('gerada '+hora(ia.gerado_em)+(ia.data_consulta&&op.data&&ia.data_consulta!==op.data?' para a consulta de '+data(ia.data_consulta):'')+'. Sugestão; a conduta é sua.')
         :'Ainda não gerada para este paciente. Leva cerca de 1 minuto, com o crédito do plano.')
      +'</span></div>'+botao+'</div>';
    if(est&&est.msg) h+='<div class="pil-ia-msg">'+esc(est.msg)+'</div>';
    if(est&&est.erro) h+='<div class="pil-ia-msg erro">'+esc(est.erro)+'</div>';
    else if(ia&&ia.erro&&!(est&&est.ocupado)) h+='<div class="pil-ia-msg erro">A última tentativa falhou: '+esc(ia.erro)+'</div>';
    if(c&&c.leitura_geral) h+='<div class="pil-ia-geral">'+esc(c.leitura_geral)+'</div>';
    var r=c&&c.renovacao;
    if(r&&r.produto){
      h+='<div class="pil-renov"><div class="pil-renov-t">Renovação'+(ia.momento&&ROT_MOMENTO[ia.momento]?' · '+ROT_MOMENTO[ia.momento]:'')+'</div>'
        +'<div class="pil-renov-p"><em>Produto mais indicado</em><b>'+esc(r.produto)+'</b>'+(r.alternativa?'<span>alternativa: '+esc(r.alternativa)+'</span>':'')+'</div>'
        +(r.aviso?'<div class="pil-ia-msg erro">'+esc(r.aviso)+'</div>':'')
        +(r.por_que?'<div class="pil-renov-q">'+esc(r.por_que)+'</div>':'')
        +((r.complementos||[]).length?'<div class="pil-renov-c">'+r.complementos.map(function(x){ return '<span>+ '+esc(x)+'</span>'; }).join('')+'</div>':'')
        +((r.pontos_para_conversa||[]).length?'<div class="pil-renov-f"><em>Para a conversa</em>'+r.pontos_para_conversa.map(function(x){ return '<div>“'+esc(x)+'”</div>'; }).join('')+'</div>':'')
        +'</div>';
    }
    return '<div class="pil-iax">'+h+'</div>';
  }

  /* HAG_PILARES_PAINEL_v2 (06/11/2026), pedido do Dr. com print: a nota do catalogo do CBD ocupava meia tela e
     empurrava o resto. Dose e momento viram selos; nota e efeitos ficam em 2 linhas, e um toque abre o texto inteiro. */
  function recolhe(cls, txt){
    return '<div class="'+cls+' rec" onclick="this.classList.toggle(\'aberto\')" title="Toque para ver tudo">'+txt+'</div>';
  }
  function itemHtml(k, uso){
    var h='<div class="pil-it"><div class="pil-nl"><span class="n">'+esc(uso.nome)+'</span>';
    [uso.dose,uso.momento].forEach(function(x){ if(x&&String(x).trim()) h+='<span class="pil-selo">'+esc(String(x).trim())+'</span>'; });
    h+='</div>';
    if(k && k.no_catalogo && k.no_catalogo.toLowerCase()!==String(uso.nome||'').toLowerCase()) h+='<div class="pil-mut">no catálogo: '+esc(k.no_catalogo)+'</div>';
    if(k && k.nota) h+=recolhe('nt', esc(k.nota));
    else h+='<div class="pil-mut">'+(k&&k.no_catalogo?'Sem nota no catálogo.':'Não está no catálogo.')+'</div>';
    if(k && k.efeitos) h+=recolhe('ef', '<b>Efeitos comuns:</b> '+esc(k.efeitos));
    var es=(k&&k.escada)||[], vistos={}, at=dose(uso.dose);
    es=es.filter(function(d){ var c=dose(d); if(vistos[c]) return false; vistos[c]=1; return true; });
    if(es.length>1) h+='<div class="pil-esc">'+es.map(function(d){ return '<span'+(dose(d)===at?' class="at"':'')+'>'+esc(d)+'</span>'; }).join('')+'</div>';
    return h+'</div>';
  }

  function render(d, op){
    var cx='pil-x'+(op&&op.escuro?' pil-auto':'');
    var iac=(op&&op.pid&&IAS[op.pid]&&IAS[op.pid].conteudo&&IAS[op.pid].conteudo.pilares)||{};   /* HAG_PILARES_IA_v1 */
    if(!d) return '<div class="'+cx+'"><div class="pil-mut">Sem dados.</div></div>';
    var it=d.itens||{}, topo='', esq='', pil='';
    var uc=d.ultima_consulta;
    topo+=topoIA(op);   /* HAG_PILARES_IA_v1: analise geral e renovacao no topo */
    topo+='<div class="pil-meta">'+(uc?('Conduta da última consulta, <b>'+data(uc.data)+'</b>'+(uc.etapa?' ('+esc(uc.etapa)+')':'')+'.'):'Paciente sem consulta registrada.')
      +' Montado só com os dados do sistema, sem IA.</div>';
    /* avisos de contraindicacao e atencao primeiro; mesma mensagem para itens irmaos vira um aviso so */
    var grp={}, ord=[];
    (d.regras||[]).filter(function(r){return r.nivel!=='indicacao';}).forEach(function(r){
      var ch=r.nivel+'|'+r.mensagem; if(!grp[ch]){ grp[ch]={nivel:r.nivel,mensagem:r.mensagem,itens:[]}; ord.push(ch); }
      if(grp[ch].itens.indexOf(r.item)<0) grp[ch].itens.push(r.item);
    });
    ord.forEach(function(ch){ var g=grp[ch];
      topo+='<div class="pil-al '+(g.nivel==='contra'?'contra':'atencao')+'"><b>'+(g.nivel==='contra'?'⚠ NÃO COMBINAR · ':'⚠ ATENÇÃO · ')+esc(g.itens.join(' e '))+'</b>'+esc(g.mensagem)+'</div>';
    });
    /* evolucao: inicio, anterior e ultima (linhas repetidas da mesma data contam uma vez) */
    var ev=[], vist={};
    (d.evolucao||[]).forEach(function(e){ var c=e.data+'|'+e.peso+'|'+e.gordura; if(!vist[c]){ vist[c]=1; ev.push(e); } });
    if(ev.length){
      var a=ev[0], z=ev[ev.length-1], y=ev.length>2?ev[ev.length-2]:null;
      var col=function(e){ return e?'<th>'+esc(e.etapa||'')+' '+data(e.data)+'</th>':''; };
      var lin=function(rot,campo,dec,un){
        return '<tr><td>'+rot+'</td><td>'+fmt(num(a[campo]),dec)+un+'</td>'+(y?'<td>'+fmt(num(y[campo]),dec)+un+'</td>':'')
          +(ev.length>1?'<td>'+fmt(num(z[campo]),dec)+un+'</td><td class="dt">'+delta(num(a[campo]),num(z[campo]),dec)+'</td>':'')+'</tr>';
      };
      esq+='<div class="pil-box"><div class="pil-sec">Evolução desde o início</div><table class="pil-tab"><tr><th></th>'+col(a)+(y?col(y):'')+(ev.length>1?col(z)+'<th>desde o início</th>':'')+'</tr>'
        +lin('Peso','peso',1,' kg')+lin('% gordura','gordura',1,'')+lin('Massa magra','massa_magra',1,' kg')+'</table></div>';
    }
    var mk=(d.marcadores||[]), mk2=mk.filter(function(m){return m.medidas>1;}), mk1=mk.filter(function(m){return m.medidas===1;});
    if(mk2.length||mk1.length){
      var m='<div class="pil-box"><div class="pil-sec">Marcadores, primeiro e último</div>';
      if(mk2.length){
        m+='<table class="pil-tab"><tr><th></th><th>primeiro</th><th>último</th><th>diferença</th></tr>';
        mk2.forEach(function(x){ m+='<tr><td>'+esc(x.nome)+'</td><td>'+vv(num(x.primeiro))+' <span class="pil-mut">'+data(x.primeiro_em)+'</span></td><td>'+vv(num(x.ultimo))+' <span class="pil-mut">'+data(x.ultimo_em)+'</span></td><td class="dt">'+(function(p,u){ if(p==null||u==null) return '—'; var q=Math.round((u-p)*100)/100; return (q>0?'+':'')+vv(q); })(num(x.primeiro),num(x.ultimo))+'</td></tr>'; });
        m+='</table>';
      }
      if(mk1.length) m+='<div class="pil-mut">Uma medida só: '+mk1.map(function(x){ return esc(x.nome)+' '+vv(num(x.ultimo))+' ('+data(x.ultimo_em)+')'; }).join(' · ')+'</div>';
      esq+=m+'</div>';
    }
    /* os quatro pilares */
    var conh=d.conhecimento||[], reg=d.regras||[], cam=d.caminhos||{}, colA='', colB='';
    var pesoAtual=ev.length?num(ev[ev.length-1].peso):null;
    [['dieta','Dieta'],['suplemento','Suplemento'],['medicacao','Medicação'],['exercicio','Exercício']].forEach(function(pp){
      var k=pp[0], lista=(k==='dieta')?String(it.dieta||'').split(/\s\+\s|;/).map(function(x){return x.trim();}).filter(Boolean).map(function(x){return {nome:x};}):((it[k])||[]);
      var ks=conh.filter(function(c){return c.pilar===k;});
      var vazio=!lista.length && k!=='dieta' && !(iac[k]&&iac[k].leitura) && !reg.some(function(r){return r.nivel==='indicacao'&&r.pilar===k;}) && !(cam[k]||[]).length;
      if(vazio){ colB+='<div class="pil-card pil-'+k+' curto"><h4>'+pp[1]+'<span>nada prescrito na última consulta</span></h4></div>'; return; }
      var h='<div class="pil-card pil-'+k+'"><h4>'+pp[1]+'<span>'+(lista.length?(lista.length+(lista.length===1?' item':' itens')):'nada prescrito')+'</span></h4><div class="pil-in">';
      h+=blocoIA(iac[k]);   /* HAG_PILARES_IA_v1: a leitura da IA abre o pilar, antes do que esta prescrito */
      if(k==='dieta'){
        var pl=it.dieta_plano||{}, ptn=num(pl.ptn), partes=[];
        if(num(pl.kcal)) partes.push('<b>'+fmt(num(pl.kcal),0)+' kcal</b>');
        if(ptn) partes.push('proteína '+fmt(ptn,0)+' g'+(pesoAtual?' ('+fmt(ptn/pesoAtual,1)+' g/kg)':''));
        if(num(pl.cho)) partes.push('carbo '+fmt(num(pl.cho),0)+' g');
        if(num(pl.lip)) partes.push('gordura '+fmt(num(pl.lip),0)+' g');
        if(num(pl.refeicoes)) partes.push(fmt(num(pl.refeicoes),0)+' refeições');
        if(num(it.agua_litros_dia)) partes.push('água '+fmt(num(it.agua_litros_dia),1)+' L');
        if(partes.length) h+='<div class="pil-it"><div class="nt pil-forte">'+partes.join(' · ')+'</div></div>';
        else h+='<div class="pil-mut">Plano sem kcal e macros registrados.</div>';
      }
      if(!lista.length && k!=='dieta') h+='<div class="pil-mut">Nada prescrito na última consulta.</div>';
      lista.forEach(function(u){
        var kk=ks.filter(function(c){ return String(c.nome||'')===String(u.nome||''); })[0]||null;
        h+=itemHtml(kk,u);
      });
      reg.filter(function(r){return r.nivel==='indicacao' && r.pilar===k;}).forEach(function(r){
        h+='<div class="pil-ind">✓ '+esc(r.item)+': '+esc(r.mensagem)+'</div>';
      });
      if(k==='dieta'||k==='exercicio'){
        var opts=cam[k]||[], emUso={};
        lista.forEach(function(u){ emUso[String(u.nome||'').toLowerCase()]=1; });
        var flag={}; reg.forEach(function(r){ if(r.pilar===k && r.nivel!=='indicacao'){ var c=flag[r.item]; if(!c||r.nivel==='contra') flag[r.item]=r.nivel; } });
        var ordc=opts.slice().sort(function(x,y){ var px=(emUso[x.nome.toLowerCase()]?0:flag[x.nome]?1:2), py=(emUso[y.nome.toLowerCase()]?0:flag[y.nome]?1:2); return px-py; });
        h+='<details><summary>Caminhos do catálogo ('+opts.length+')</summary>'+ordc.map(function(o){
          var t=emUso[o.nome.toLowerCase()]?'<span class="tag uso">EM USO</span>':'';
          if(flag[o.nome]) t+='<span class="tag '+flag[o.nome]+'">'+(flag[o.nome]==='contra'?'NÃO COMBINAR':'ATENÇÃO')+'</span>';
          return '<div class="pil-cam"><b>'+esc(o.nome)+'</b>'+t+(o.nota?'<div class="pil-mut">'+esc(o.nota)+'</div>':'')+'</div>';
        }).join('')+'</details>';
      }
      if(k==='medicacao') colA+=h+'</div></div>'; else colB+=h+'</div></div>';
    });
    var rod='<div class="pil-rod">Os avisos saem de regras fixas tiradas das notas do catálogo (tabela <code>catalogo_regras_pilares</code>). As notas de dieta e exercício foram <b>revisadas e liberadas pelo Dr. Henrique em 22/09/2026</b> (o Velocity segue sem nota). O painel mostra; a conduta é sua.</div>';
    pil='<div class="pil-c pil-ca">'+colA+'</div><div class="pil-c pil-cb">'+colB+'</div>';
    return '<div class="'+cx+'">'+topo+'<div class="pil-g4">'+pil+'</div><div class="pil-g2">'+esq+'</div>'+rod+'</div>';
  }

  var FM="'DejaVu Sans Mono','Jost',ui-monospace,monospace";
  var CSS=[
  '.pil-x{font-size:13px;line-height:1.5;color:#2B2A26;container-type:inline-size;container-name:pil}',
  '.pil-x .pil-meta{font-size:11.5px;color:#6E6A60;margin-bottom:9px;line-height:1.45}',
  '.pil-x .pil-sec{font-family:'+FM+';font-size:9.8px;letter-spacing:.16em;text-transform:uppercase;color:#8C4F2B;margin:0 0 6px;padding-bottom:3px;border-bottom:1px solid #E4DECB}',
  '.pil-x .pil-box{border:1px solid #E4DECB;border-radius:12px;background:#fff;padding:10px 12px;margin:0 0 10px}',
  '.pil-x .pil-tab{width:100%;border-collapse:collapse;font-size:12.4px;margin-bottom:4px}',
  '.pil-x .pil-tab th{font-family:'+FM+';font-size:8.8px;letter-spacing:.1em;text-transform:uppercase;color:#6E6A60;font-weight:400;text-align:right;padding:2px 5px}',
  '.pil-x .pil-tab th:first-child,.pil-x .pil-tab td:first-child{text-align:left}',
  '.pil-x .pil-tab td{padding:4px 5px;border-top:1px solid #F0EDE4;text-align:right;white-space:nowrap}',
  '.pil-x .pil-tab td.dt{font-weight:700}',
  '.pil-x .pil-mut{color:#6E6A60;font-size:11.4px}',
  '.pil-x .pil-al{border-radius:10px;padding:8px 11px;margin:0 0 8px;font-size:12.6px;line-height:1.45}',
  '.pil-x .pil-al.contra{background:#FBEAEA;border:1px solid #E6B8B8;color:#7A2323}',
  '.pil-x .pil-al.atencao{background:#FCF3E8;border:1px solid #EBD9BE;color:#7A4A1E}',
  '.pil-x .pil-al b{display:block;font-size:11.4px;letter-spacing:.04em}',
  '.pil-x .pil-card{border:1px solid #E4DECB;border-radius:12px;margin:0 0 10px;overflow:hidden;background:#fff}',
  '.pil-x .pil-card>h4{margin:0;background:#33251E;color:#fff;font-family:'+FM+';font-size:10.4px;letter-spacing:.18em;text-transform:uppercase;padding:7px 12px;display:flex;justify-content:space-between}',
  '.pil-x .pil-card>h4 span{color:#D2B48F;font-weight:400;letter-spacing:.08em}',
  '.pil-x .pil-in{padding:8px 12px 10px}',
  '.pil-x .pil-it{padding:6px 0;border-bottom:1px dashed #E4DECB}',
  '.pil-x .pil-it:last-child{border-bottom:0}',
  '.pil-x .pil-it .n{font-weight:700;font-size:13.4px;color:#33251E}',
  '.pil-x .pil-nl{display:flex;flex-wrap:wrap;align-items:baseline;gap:5px}',
  '.pil-x .pil-selo{font-family:'+FM+';font-size:10.2px;color:#7A5A22;background:#F7F0DF;border-radius:20px;padding:1px 8px;line-height:1.6}',
  '.pil-x .pil-it .nt{font-size:12px;color:#5a564d;margin-top:4px;line-height:1.45}',
  '.pil-x .rec{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;position:relative}',
  '.pil-x .rec.aberto{display:block;-webkit-line-clamp:unset}',
  '.pil-x .rec:hover{background:#FBFAF6;border-radius:5px}',
  '.pil-x .pil-it .nt.pil-forte{color:#2B2A26;font-size:12.6px}',
  '.pil-x .pil-it .ef{font-size:11.6px;color:#7A4A1E;margin-top:3px}',
  '.pil-x .pil-it .ef b{font-weight:700}',
  '.pil-x .pil-card.curto{background:#FBFAF6}',
  '.pil-x .pil-card.curto>h4{background:#E9E4D6;color:#6E6A60}',
  '.pil-x .pil-card.curto>h4 span{color:#8A8475}',
  '.pil-x .pil-g4{display:flex;flex-direction:column}',
  '.pil-x .pil-c{display:contents}',
  '.pil-x .pil-dieta{order:1}.pil-x .pil-suplemento{order:2}.pil-x .pil-medicacao{order:3}.pil-x .pil-exercicio{order:4}',
  /* modo escuro do HAG OS (hag_visual_os_escuro.css) pinta table e th de escuro com !important; aqui o painel
     e claro de proposito, entao a tabela fica clara tambem (no print os valores sumiam) */
  '.pil-x table.pil-tab,.pil-x .pil-tab th,.pil-x .pil-tab td{background:#fff !important;color:#2B2A26 !important}',
  '.pil-x .pil-tab th{color:#6E6A60 !important}',
  '.pil-x .pil-tab .pil-mut{color:#8A8475 !important}',
  '.pil-x .pil-esc{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}',
  '.pil-x .pil-esc span{font-family:'+FM+';font-size:9.8px;border:1px solid #E4DECB;border-radius:4px;padding:1px 6px;color:#6E6A60}',
  '.pil-x .pil-esc span.at{background:#33251E;border-color:#33251E;color:#fff;font-weight:700}',
  '.pil-x .pil-ind{font-size:11.8px;color:#2F6B48;margin:5px 0 0;line-height:1.45}',
  '.pil-x .pil-card details{margin-top:7px;font-size:11.8px}',
  '.pil-x .pil-card summary{cursor:pointer;font-family:'+FM+';font-size:9.8px;letter-spacing:.12em;text-transform:uppercase;color:#6E6A60}',
  '.pil-x .pil-cam{padding:5px 0;border-bottom:1px solid #F0EDE4;line-height:1.45}',
  '.pil-x .pil-cam:last-child{border-bottom:0}',
  '.pil-x .pil-cam .tag{font-family:'+FM+';font-size:8.8px;letter-spacing:.08em;border-radius:3px;padding:0 4px;margin-left:5px;vertical-align:1px}',
  '.pil-x .pil-cam .tag.uso{background:#E8F1EC;color:#2F6B48}',
  '.pil-x .pil-cam .tag.contra{background:#FBEAEA;color:#7A2323}',
  '.pil-x .pil-cam .tag.atencao{background:#FCF3E8;color:#7A4A1E}',
  '.pil-x .pil-rod{font-size:10.8px;color:#6E6A60;margin-top:4px;line-height:1.5;border-top:1px solid #E4DECB;padding-top:8px}',
  '.pil-x code{font-family:'+FM+';font-size:10.5px;background:#F3F1EA !important;color:#5a564d !important;border-radius:4px;padding:0 4px}',
  /* tela larga: os quatro pilares em 2 x 2; evolucao e marcadores lado a lado */
  '@container pil (min-width: 900px){'
    +'.pil-x .pil-g4{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:0 12px;align-items:start}'
    +'.pil-x .pil-c{display:block}'
    +'.pil-x .pil-g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:0 12px;align-items:start}'
  +'}',
  /* HAG_PILARES_IA_v1: analise de IA */
  '.pil-x .pil-iax{margin:0 0 10px}',
  '.pil-x .pil-ia-cab{display:flex;align-items:center;gap:10px;justify-content:space-between;border:1px solid #D9C9A3;background:#FBF6EA;border-radius:12px;padding:9px 12px}',
  '.pil-x .pil-ia-cab b{display:block;font-size:13px;color:#33251E}',
  '.pil-x .pil-ia-cab span{display:block;font-size:11.4px;color:#6E6A60;line-height:1.4}',
  '.pil-x .pil-ia-bt{flex:none;font:inherit;font-size:12.4px;font-weight:600;border:0;border-radius:9px;padding:8px 12px;background:#33251E;color:#fff;cursor:pointer}',
  '.pil-x .pil-ia-bt[disabled]{opacity:.55;cursor:default}',
  '.pil-x .pil-ia-msg{font-size:12px;color:#2563a8;background:#e8f0fa;border-radius:9px;padding:7px 10px;margin:6px 0 0}',
  '.pil-x .pil-ia-msg.erro{color:#8A3414;background:#FDF0EA}',
  '.pil-x .pil-ia-geral{font-size:13px;line-height:1.5;color:#2B2A26;margin:8px 2px 0}',
  '.pil-x .pil-renov{border:1.5px solid #B98A5E;border-radius:12px;padding:10px 12px;margin:10px 0 0;background:#fff}',
  '.pil-x .pil-renov-t{font-family:'+FM+';font-size:9.8px;letter-spacing:.16em;text-transform:uppercase;color:#8C4F2B;margin:0 0 6px}',
  '.pil-x .pil-renov-p em,.pil-x .pil-renov-f em,.pil-x .pil-ia-mr em{display:block;font-style:normal;font-family:'+FM+';font-size:9.2px;letter-spacing:.1em;text-transform:uppercase;color:#98917F}',
  '.pil-x .pil-renov-p b{display:block;font-size:17px;color:#33251E;line-height:1.3}',
  '.pil-x .pil-renov-p span{font-size:12px;color:#6E6A60}',
  '.pil-x .pil-renov-q{font-size:12.8px;line-height:1.5;margin:6px 0 0;color:#3F3B33}',
  '.pil-x .pil-renov-c{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0 0}',
  '.pil-x .pil-renov-c span{font-size:11.6px;border-radius:20px;padding:2px 9px;background:#F7F0DF;color:#7A5A22}',
  '.pil-x .pil-renov-f{margin:8px 0 0;border-top:1px solid #F0EDE4;padding-top:7px}',
  '.pil-x .pil-renov-f div{font-size:12.8px;line-height:1.45;color:#3F3B33;margin:3px 0}',
  '.pil-x .pil-ia{background:#F6F8FC;border:1px solid #D6E0F0;border-radius:10px;padding:8px 10px;margin:0 0 8px}',
  '.pil-x .pil-ia-t{font-family:'+FM+';font-size:9.4px;letter-spacing:.14em;text-transform:uppercase;color:#4A6797;margin:0 0 4px}',
  '.pil-x .pil-ia-l{font-size:12.8px;line-height:1.45;color:#2B2A26}',
  '.pil-x .pil-ia-mr{margin:7px 0 0;border-left:3px solid #2F6B48;padding:2px 0 2px 8px}',
  '.pil-x .pil-ia-mr b{display:block;font-size:13.2px;color:#1E4D33}',
  '.pil-x .pil-ia-mr span{display:block;font-size:12px;color:#4A463E;line-height:1.4}',
  '.pil-x .pil-ia-op{margin:6px 0 0}',
  '.pil-x .pil-ia-op summary{cursor:pointer;font-family:'+FM+';font-size:9.8px;letter-spacing:.12em;text-transform:uppercase;color:#4A6797;padding:3px 0}',
  '.pil-x .pil-ia-o{padding:4px 0;border-top:1px solid #E3E9F3;font-size:12.4px;line-height:1.4}',
  '.pil-x .pil-ia-o b{display:block;color:#33251E}',
  '.pil-x .pil-ia-o span{color:#55565c}',
  '.pil-x .pil-ia-v{font-size:11.8px;color:#7A4A1E;margin:6px 0 0}',
  /* HAG_PILARES_PAINEL_v2_1: CELULAR (container de ate 520 px) */
  '@container pil (max-width: 520px){'
    +'.pil-x{font-size:13.8px}'
    +'.pil-x .pil-box{overflow-x:auto;padding:10px 10px}'
    +'.pil-x .pil-tab{font-size:12.6px}'
    +'.pil-x .pil-tab th{white-space:normal;vertical-align:bottom}'
    +'.pil-x .pil-it .n{font-size:14px}'
    +'.pil-x .pil-it .nt{font-size:13px}'
    +'.pil-x .pil-it .ef{font-size:12.4px}'
    +'.pil-x .pil-selo{font-size:10.8px}'
    +'.pil-x .pil-al{font-size:13.2px}'
    +'.pil-x .pil-card summary{padding:6px 0;font-size:10.4px}'
    +'.pil-x .pil-in{padding:8px 11px 10px}'
    +'.pil-x .pil-tab td .pil-mut{display:block;font-size:10.5px;line-height:1.2}'
    +'.pil-x .pil-tab td,.pil-x .pil-tab th{padding-left:4px;padding-right:4px}'
    +'.pil-x .pil-card>h4{gap:4px 10px;flex-wrap:wrap}'
    +'.pil-x .pil-ia-cab{flex-direction:column;align-items:stretch}'
    +'.pil-x .pil-ia-bt{padding:10px 12px;font-size:13.4px}'
    +'.pil-x .pil-ia-l,.pil-x .pil-ia-geral{font-size:13.6px}'
    +'.pil-x .pil-ia-mr b{font-size:14px}'
    +'.pil-x .pil-ia-mr span,.pil-x .pil-ia-o{font-size:13px}'
    +'.pil-x .pil-ia-op summary{padding:7px 0;font-size:10.4px}'
    +'.pil-x .pil-renov-q,.pil-x .pil-renov-f div{font-size:13.6px}'
  +'}',
  /* HAG_PILARES_PAINEL_v2_1: TEMA ESCURO OPCIONAL (classe pil-auto), cores do HAG Dr.
     Vem com !important e seletor mais forte porque a regra clara acima tambem usa !important. */
  '@media (prefers-color-scheme: dark){'
    +'.pil-x.pil-auto{color:#E3E6EC}'
    +'.pil-x.pil-auto .pil-meta,.pil-x.pil-auto .pil-mut,.pil-x.pil-auto .pil-rod{color:#8D95A8}'
    +'.pil-x.pil-auto .pil-sec{color:#D9B877;border-bottom-color:#2E3647}'
    +'.pil-x.pil-auto .pil-box,.pil-x.pil-auto .pil-card{background:#202634;border-color:#2E3647}'
    +'.pil-x.pil-auto table.pil-tab,.pil-x.pil-auto table.pil-tab th,.pil-x.pil-auto table.pil-tab td{background:#202634 !important;color:#E3E6EC !important}'
    +'.pil-x.pil-auto table.pil-tab th{color:#8D95A8 !important}'
    +'.pil-x.pil-auto table.pil-tab td{border-top-color:#2E3647}'
    +'.pil-x.pil-auto table.pil-tab .pil-mut{color:#8D95A8 !important}'
    +'.pil-x.pil-auto .pil-al.contra{background:#35201F;border-color:#5A302C;color:#F8C9BE}'
    +'.pil-x.pil-auto .pil-al.atencao{background:#372B17;border-color:#5A4522;color:#F2CF95}'
    +'.pil-x.pil-auto .pil-card>h4{background:#26314F;color:#EEF0F4}'
    +'.pil-x.pil-auto .pil-card>h4 span{color:#D9B877}'
    +'.pil-x.pil-auto .pil-it{border-bottom-color:#2E3647}'
    +'.pil-x.pil-auto .pil-it .n{color:#F1F3F7}'
    +'.pil-x.pil-auto .pil-selo{background:#2F2A1E;color:#E9C98A}'
    +'.pil-x.pil-auto .pil-it .nt{color:#C3C8D2}'
    +'.pil-x.pil-auto .pil-it .nt.pil-forte{color:#F1F3F7}'
    +'.pil-x.pil-auto .pil-it .ef{color:#E9C083}'
    +'.pil-x.pil-auto .rec:hover{background:#262D3D}'
    +'.pil-x.pil-auto .pil-card.curto{background:#1D2230}'
    +'.pil-x.pil-auto .pil-card.curto>h4{background:#2A3141;color:#9AA1B2}'
    +'.pil-x.pil-auto .pil-card.curto>h4 span{color:#8D95A8}'
    +'.pil-x.pil-auto .pil-esc span{border-color:#343D50;color:#9AA1B2}'
    +'.pil-x.pil-auto .pil-esc span.at{background:#B98A5E;border-color:#B98A5E;color:#14161C}'
    +'.pil-x.pil-auto .pil-ind{color:#7FCF9F}'
    +'.pil-x.pil-auto .pil-card summary{color:#9AA1B2}'
    +'.pil-x.pil-auto .pil-cam{border-bottom-color:#2E3647}'
    +'.pil-x.pil-auto .pil-cam .tag.uso{background:#1D3327;color:#7FCF9F}'
    +'.pil-x.pil-auto .pil-cam .tag.contra{background:#3A1F22;color:#F08D86}'
    +'.pil-x.pil-auto .pil-cam .tag.atencao{background:#372B17;color:#E5B569}'
    +'.pil-x.pil-auto .pil-rod{border-top-color:#2E3647}'
    +'.pil-x.pil-auto code{background:#2A3141 !important;color:#C3C8D2 !important}'
    /* HAG_PILARES_IA_v1 no escuro */
    +'.pil-x.pil-auto .pil-ia-cab{background:#2B261B;border-color:#5A4A2A}'
    +'.pil-x.pil-auto .pil-ia-cab b{color:#F1F3F7}'
    +'.pil-x.pil-auto .pil-ia-cab span{color:#9AA1B2}'
    +'.pil-x.pil-auto .pil-ia-bt{background:#B98A5E;color:#14161C}'
    +'.pil-x.pil-auto .pil-ia-msg{background:#2A1F18;color:#8DB8F0}'
    +'.pil-x.pil-auto .pil-ia-msg.erro{background:#3A1F22;color:#F3A08F}'
    +'.pil-x.pil-auto .pil-ia-geral{color:#D5D9E2}'
    +'.pil-x.pil-auto .pil-renov{background:#202634;border-color:#B98A5E}'
    +'.pil-x.pil-auto .pil-renov-t{color:#D9B877}'
    +'.pil-x.pil-auto .pil-renov-p b{color:#F2CF95}'
    +'.pil-x.pil-auto .pil-renov-p span,.pil-x.pil-auto .pil-renov-p em,.pil-x.pil-auto .pil-renov-f em,.pil-x.pil-auto .pil-ia-mr em{color:#8D95A8}'
    +'.pil-x.pil-auto .pil-renov-q,.pil-x.pil-auto .pil-renov-f div{color:#D5D9E2}'
    +'.pil-x.pil-auto .pil-renov-c span{background:#2F2A1E;color:#E9C98A}'
    +'.pil-x.pil-auto .pil-renov-f{border-top-color:#2E3647}'
    +'.pil-x.pil-auto .pil-ia{background:#1B2335;border-color:#2F4266}'
    +'.pil-x.pil-auto .pil-ia-t,.pil-x.pil-auto .pil-ia-op summary{color:#8DB8F0}'
    +'.pil-x.pil-auto .pil-ia-l{color:#E3E6EC}'
    +'.pil-x.pil-auto .pil-ia-mr{border-left-color:#7FCF9F}'
    +'.pil-x.pil-auto .pil-ia-mr b{color:#A6E2BD}'
    +'.pil-x.pil-auto .pil-ia-mr span,.pil-x.pil-auto .pil-ia-o span{color:#B5BAC6}'
    +'.pil-x.pil-auto .pil-ia-o{border-top-color:#2E3647}'
    +'.pil-x.pil-auto .pil-ia-o b{color:#F1F3F7}'
    +'.pil-x.pil-auto .pil-ia-v{color:#E9C083}'
  +'}'
  ].join('\n');
  var injetado=false;
  var cliqueLigado=false;
  function injetar(){
    if(!cliqueLigado){ cliqueLigado=true;
      try{ document.addEventListener('click', function(e){
        var b=e.target&&e.target.closest&&e.target.closest('[data-pil-ia]'); if(!b) return;
        /* data-pil-dia, e nao data-dia: o HAG Dr ja usa [data-dia] para trocar o dia da agenda e fechava o cartao */
        e.preventDefault(); e.stopPropagation(); pedirIA(b.getAttribute('data-pil-ia'), b.getAttribute('data-pil-dia')||null);
      }); }catch(e){}
    }
    if(injetado) return;
    try{ var st=document.createElement('style'); st.id='hag-pilares-css'; st.textContent=CSS; (document.head||document.documentElement).appendChild(st); injetado=true; }catch(e){}
  }
  raiz.HAGPilares={ render:render, carregar:carregar, carregarTudo:carregarTudo, carregarIA:carregarIA, config:config, pedirIA:pedirIA,
                    injetar:injetar, css:CSS, versao:'v2.2' };
})(typeof self!=='undefined'?self:this);
