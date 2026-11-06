/* HAG_BRIEFING_CARDS_v3 ──────────────────────────────────────────────────────
   06/11/2026 · Renderizador do briefing de consulta em cartoes.
   (v2 de 28/08/2026; o contrato e o mesmo.)

   PORQUE EXISTE: o briefing e lido DURANTE a consulta, de relance, sem perder o
   contato visual com o paciente. Em texto corrido isso exige parar e ler.

   PORQUE E ARQUIVO PROPRIO: as duas telas que mostram briefing (o painel lateral
   do consulta_motor_HAG.html e a pagina briefings_HAG.html) precisam do MESMO
   desenho. Copiar e colar o renderizador criaria duas versoes que divergem na
   primeira mudanca. Aqui ele e um so.

   O QUE MUDOU NA v3 (pedido do Dr. em 06/11/2026, com print da tela: "arrume e
   melhore o layout para algo mais organizado e facil de me guiar na consulta"):
   - Tela larga (container de 900 px ou mais) vira DUAS COLUNAS na ordem da
     consulta: alertas e roteiro em cima, ocupando a largura toda; a esquerda o
     que se PERGUNTA e o fechamento; a direita o que se OLHA (exames e dados) e o
     que se DECIDE (medicacoes e decisoes). Tela estreita (painel do motor)
     continua uma coluna so, na mesma ordem. E container query, nao media query:
     o mesmo arquivo serve a pagina larga e o painel estreito sem codigo extra.
   - A linha "Atual:" das medicacoes vinha numa linha so, que no print saia da
     tela. Agora e uma lista, um remedio por linha, com o prazo num selo
     (vermelho quando termina em 7 dias ou menos, ou com receita vencida).
   - As linhas de exame que o sistema insere (HAG_BRIEFING_EXAMES_v2) ganharam
     desenho proprio: faixa com as datas do ultimo exame, caixa "Avaliar hoje" e
     aviso de pedido sem resultado. No print o **negrito** aparecia com os
     asteriscos; agora o negrito do markdown e lido em todo texto.
   - Etiquetas de dado quebram linha em vez de estourar a largura.
   - "Vigiar: NADA_A_VIGIAR" (o modelo copiou a chave interna num briefing de
     07/11) nao aparece.

   v3.1 (06/11/2026, pedido do Dr. com print do HAG Dr no celular: "poderia
   melhorar tambem como ve no celular"). O HAG Dr mostrava o briefing como texto
   corrido, com o renderizador antigo dele. Agora usa este mesmo arquivo:
   - ESTE ARQUIVO EXISTE EM DOIS LUGARES DE PROPOSITO, identicos byte a byte:
     HAG_Consultas (painel do motor e briefings_HAG.html, abertos do Mac) e o
     repositorio publicado (hag_dr_HAG.html, no celular). Mudou num, copie para o
     outro e confira o md5. O hag_checa_duplicados.py confere os dois.
     Por estar publicado: nada de nome de paciente, preco ou conduta aqui.
   - Tema escuro OPCIONAL: quem quiser que o briefing acompanhe o modo escuro do
     aparelho poe a classe "brf-auto" junto de "brf-cards". Sem a classe, nada
     muda (as paginas do Mac continuam claras, como foram conferidas).
   - Container estreito (ate 520 px, o celular): rotulo das linhas em cima do
     texto em vez de coluna de 120 px, letra um pouco maior, alvo de toque
     maior nas caixas de marcar e o roteiro em grade de duas colunas.
   - Pergunta com parentese no fim ("Efeito do X (humor, fome)") virava duas
     colunas dentro da caixa de marcar; agora o texto e um bloco so.

   O modulo e autossuficiente de proposito: escapa o proprio HTML e traz o
   proprio CSS com as cores da paleta escritas por extenso, sem depender das
   variaveis CSS de cada pagina, que tem nomes diferentes.

   USO:
     HAGBriefingCards.injetar();              // uma vez, na carga da pagina
     var html = HAGBriefingCards.render(md);  // null se o formato nao bater
     alvo.innerHTML = html || renderAntigo(md);

   CONTRATO: render() devolve null quando nao encontra nenhuma secao "##". Quem
   chama DEVE ter um caminho de queda, para briefing nenhum ficar ilegivel por
   causa desta tela. A marcacao de caixa e visual e efemera, nao grava nada.
--------------------------------------------------------------------------- */
(function (raiz) {
  'use strict';

  function esc(s){
    return String(s==null?'':s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  /* texto com negrito do markdown; o resto escapado */
  function inl(s){
    return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*\*/g,'');
  }
  function semMarca(s){ return String(s||'').replace(/\*\*/g,''); }

  function tipoDaSecao(titulo){
    var t=String(titulo||'').toLowerCase();
    if(/esquecer|alerta|aten..o|cr.tic/.test(t)) return 'alerta';
    if(/foco/.test(t)) return 'foco';
    if(/perguntar|pergunta/.test(t)) return 'perguntas';
    if(/dados|exame|laborat/.test(t)) return 'dados';
    if(/decidir|conduta|prescri|atual/.test(t)) return 'conduta';
    if(/fechamento|encerr/.test(t)) return 'fechamento';
    return 'texto';
  }
  /* titulo sem o emoji do modelo: o cartao ja tem o proprio icone */
  function tituloLimpo(t){
    return String(t||'').replace(/^[^A-Za-zÀ-ÿ0-9]+/,'').trim();
  }
  var ICONE = { alerta:'⚠', foco:'➜', perguntas:'?', dados:'◧', conduta:'℞', fechamento:'◎', texto:'·' };

  /* "Ferro: completou os 30d?" -> rotulo em negrito + resto */
  function comRotulo(txt){
    var t=semMarca(txt);
    var m=t.match(/^([^:(]{2,34}):\s*(.+)$/);   /* rotulo nunca tem parentese: "(ultimo: 54kg" nao e rotulo */
    return m ? '<span><b>'+esc(m[1])+'</b> '+inl(m[2])+'</span>'
             : '<span>'+inl(txt)+'</span>';
  }

  /* "Peso 77,5 (jun 77,4 -> ago 77,5)" -> etiqueta com valor em negrito */
  function etiqueta(txt){
    var t=semMarca(txt).trim(); if(!t) return '';
    var alerta=/[⚠!]/.test(t);
    t=t.replace(/[⚠!]/g,'').replace(/\s{2,}/g,' ').trim();
    var m=t.match(/^([^0-9]{1,26}?)[\s:]+([0-9−\-+].*)$/);
    var dentro = m ? (esc(m[1].replace(/[:\s]+$/,''))+' <b>'+esc(m[2])+'</b>') : esc(t);
    return '<span class="brf-chip'+(alerta?' at':'')+(t.length>46?' longo':'')+'">'+(alerta?'⚠ ':'')+dentro+'</span>';
  }

  function linhaDeEtiquetas(L){
    var rotulo='', corpo=semMarca(L);
    var m=corpo.match(/^([A-Za-zÀ-ÿ0-9\s\/\-]{2,30}):\s*(.+)$/);
    if(m && /·|\|/.test(m[2])){ rotulo=m[1]; corpo=m[2]; }
    var itens=corpo.split(/\s*[·|]\s*/).filter(function(x){return x.trim();});
    if(itens.length<2 && !rotulo){
      /* frase solta: linha simples, nao uma etiqueta gigante */
      var al=/[⚠]/.test(corpo);
      return '<div class="brf-frase'+(al?' at':'')+'">'+inl(L.replace(/⚠/g,'').trim())+(al?' <i>⚠</i>':'')+'</div>';
    }
    return '<div class="brf-grupo">'
      +(rotulo?'<div class="brf-gl">'+esc(rotulo)+'</div>':'')
      +'<div class="brf-chips">'+itens.map(etiqueta).join('')+'</div></div>';
  }

  function marcavel(txt, cls){
    var t=String(txt).replace(/^[□☐\-*•]\s*/,'').replace(/^\?\s*/,'').trim();
    var cond=semMarca(t).match(/^(.*?)(\((.+)\))\s*$/);
    var corpo = cond ? (comRotulo(cond[1].trim())+' <u>('+esc(cond[3])+')</u>') : comRotulo(t);
    return '<div class="brf-mk'+(cls?' '+cls:'')+'" onclick="this.classList.toggle(\'ok\')"><i>✓</i><span>'+corpo+'</span></div>';
  }

  /* ── exames (linhas inseridas pelo sistema, HAG_BRIEFING_EXAMES_v2) ── */
  function faixaExames(L){
    var corpo=semMarca(L).replace(/^\s*Últimos exames:\s*/i,'');
    var itens=corpo.split(/\s*·\s*/).filter(function(x){return x.trim();});
    return '<div class="brf-ex"><div class="brf-gl">Último exame</div><div class="brf-ext">'+itens.map(function(it){
      var velho=/⚠/.test(it), nada=/sem registro/i.test(it);
      it=it.replace(/⚠/g,'').trim();
      var m=it.match(/^(\S+)\s+(.*)$/);
      var tipo=m?m[1]:it, resto=m?m[2]:'';
      return '<div class="brf-exi'+(velho?' velho':'')+(nada?' nada':'')+'"><em>'+esc(tipo)+'</em><b>'+esc(resto||'—')+'</b>'
        +(velho?'<small>há mais de 6 meses</small>':'')+'</div>';
    }).join('')+'</div></div>';
  }
  function caixaAvaliar(L){
    var t=semMarca(L).replace(/^[□☐]\s*/,'').replace(/^Avaliar hoje:\s*/i,'');
    var nota='', m=t.match(/^(.*?)\s*\((chegaram depois[^)]*)\)\s*$/);
    if(m){ t=m[1]; nota=m[2]; }
    var itens=t.split(/\s*·\s*/).filter(function(x){return x.trim();});
    return '<div class="brf-av" onclick="this.classList.toggle(\'ok\')"><i>✓</i><div><div class="brf-avt">Avaliar hoje</div>'
      +'<div class="brf-chips">'+itens.map(function(x){return '<span class="brf-chip av">'+esc(x)+'</span>';}).join('')+'</div>'
      +(nota?'<small>'+esc(nota)+'</small>':'')+'</div></div>';
  }
  function avisoPedido(L){
    var t=semMarca(L).replace(/^!\s*/,'').replace(/⚠/g,'').trim();
    var m=t.match(/^Pedido\s+(\S+)\s+sem resultado\s*\((\d+)d\):?\s*(.*)$/i);
    if(!m) return '<div class="brf-ped">'+inl(t)+'</div>';
    var dias=+m[2];
    return '<div class="brf-ped'+(dias>21?' forte':'')+'"><i>⏳</i><span><b>Pedido de '+esc(m[1])+' sem resultado</b> · há '+dias+' dias'
      +(m[3]?' · '+esc(m[3]):'')+'</span></div>';
  }

  /* ── medicacoes: "Atual: A ate 10/11 (4d); B continuo; ..." vira lista ── */
  function itensAtual(corpo){
    var partes=corpo.split(/\s*;\s*/);
    if(partes.length<2) partes=corpo.split(/\s+·\s+/);
    return partes.map(function(x){ return x.replace(/\.\s*$/,'').trim(); }).filter(Boolean);
  }
  function linhaRemedio(txt){
    var t=semMarca(txt), selos=[], urg=false;
    var m=t.match(/até\s+(\d{1,2}\/\d{1,2})(?:\s*\((\d+)\s*d\))?/i);
    if(m){
      var d=m[2]!=null?+m[2]:null; if(d!=null&&d<=7) urg=true;
      selos.push('<span class="brf-selo'+(d!=null&&d<=7?' urg':'')+'">até '+esc(m[1])+(d!=null?' · '+d+'d':'')+'</span>');
      t=t.replace(m[0],'');
    }
    if(/receita vencida/i.test(t)){ urg=true; selos.push('<span class="brf-selo urg">receita vencida</span>');
      t=t.replace(/⚠?\s*receita vencida(\s*\([^)]*\)|\s+\d{1,2}\/\d{1,2})?/i,''); }
    if(/\(sem receita\)/i.test(t)){ selos.push('<span class="brf-selo ama">sem receita</span>'); t=t.replace(/\(sem receita\)/i,''); }
    if(/\bcontínuo\b/i.test(t)){ selos.push('<span class="brf-selo">contínuo</span>'); t=t.replace(/\bcontínuo\b/i,''); }
    if(/\?\s*confirmar uso/i.test(t)){ selos.push('<span class="brf-selo ama">confirmar uso</span>'); t=t.replace(/\?\s*confirmar uso/i,''); }
    if(/⚠/.test(t)) urg=true;
    t=t.replace(/⚠/g,'').replace(/\s{2,}/g,' ').replace(/[\s,;·]+$/,'').trim();
    return '<div class="brf-med'+(urg?' urg':'')+'"><span class="brf-mn">'+esc(t)+'</span><span class="brf-ms">'+selos.join('')+'</span></div>';
  }
  var ROT_CONDUTA = /^(Novo desde a última consulta|Terminou sem renovação|Por mensagem \(sem registro\)|Suplementos|Implante|Vigiar|Encerrad[ao]s?|Prescrito)\s*:\s*(.*)$/i;
  function linhaRotulada(rot, txt, cls){
    var limpo=txt.replace(/⚠/g,'').trim().replace(/\s*\.$/,'');
    return '<div class="brf-lin'+(cls?' '+cls:'')+'"><em>'+esc(rot)+'</em><span>'+inl(limpo)+(/⚠/.test(txt)?' <i class="w">⚠</i>':'')+'</span></div>';
  }

  function cabecalho(cab){
    var ident=semMarca(cab[0]).split(/\s*\|\s*/);
    var h='<div class="cab"><div class="brf-cabt"><div class="brf-nome">'+esc(ident[0])+'</div>';
    if(ident.length>1){
      h+='<div class="brf-idchips">'+ident.slice(1).map(function(x){
        return '<span>'+esc(x.trim())+'</span>';}).join('')+'</div>';
    }
    h+='</div><div class="brf-cabl">';
    cab.slice(1).forEach(function(L){
      var m=semMarca(L).match(/^([^:]{2,22}):\s*(.+)$/);
      h+='<div class="brf-lin cabl">'
        +(m?'<em>'+esc(m[1])+'</em><span>'+esc(m[2])+'</span>':'<span>'+inl(L)+'</span>')
        +'</div>';
    });
    return h+'</div></div>';
  }

  function corpoDaSecao(sec){
    var corpo='';
    if(sec.tipo==='alerta'){
      corpo=sec.linhas.map(function(L){
        return '<div class="brf-al"><i>⚠</i>'+comRotulo(L.replace(/^[⚠!]\s*/,'').replace(/\s*⚠\s*$/,''))+'</div>';}).join('');
    } else if(sec.tipo==='foco'){
      var passos=semMarca(sec.linhas.join(' ')).split(/\s*(?:→|->)\s*/).filter(function(x){return x.trim();});
      corpo='<div class="brf-passo">'+passos.map(function(p,i){
        return '<span><b>'+(i+1)+'</b>'+esc(p.trim())+'</span>';}).join('<i>›</i>')+'</div>';
    } else if(sec.tipo==='perguntas'){
      corpo=sec.linhas.map(function(L){ return marcavel(L); }).join('');
    } else if(sec.tipo==='dados'){
      var exs='', outros='';
      sec.linhas.forEach(function(L){
        var s=semMarca(L);
        if(/^\s*Últimos exames:/i.test(s)) exs+=faixaExames(L);
        else if(/^\s*[□☐]\s*Avaliar hoje/i.test(s)) exs+=caixaAvaliar(L);
        else if(/^\s*!\s*Pedido\s/i.test(s)) exs+=avisoPedido(L);
        else outros+=linhaDeEtiquetas(L);
      });
      corpo=exs+(exs&&outros?'<div class="brf-sep"></div>':'')+outros;
    } else if(sec.tipo==='conduta'){
      var meds='', info='', dec='';
      sec.linhas.forEach(function(L){
        var s=semMarca(L);
        if(/^[□☐]/.test(s)){ dec+=marcavel(L,'dec'); return; }
        var a=s.match(/^Atual:\s*(.*)$/i);
        if(a){
          if(/^nada/i.test(a[1].trim())) meds+='<div class="brf-med vazio"><span class="brf-mn">'+esc(a[1])+'</span></div>';
          else meds+=itensAtual(a[1]).map(linhaRemedio).join('');
          return;
        }
        var r=s.match(ROT_CONDUTA);
        if(r){
          if(/^vigiar/i.test(r[1]) && /NADA_A_VIGIAR|^\s*$/.test(r[2])) return;
          var cls=/^(por mensagem|vigiar)/i.test(r[1])?'at':(/^terminou/i.test(r[1])?'fim':'');
          info+=linhaRotulada(r[1].replace(/\s*\(sem registro\)/i,' (sem registro)'), r[2], cls);
          return;
        }
        info+=linhaDeEtiquetas(L);
      });
      corpo=(meds?'<div class="brf-gl">Em uso</div><div class="brf-meds">'+meds+'</div>':'')
           +(info?'<div class="brf-info">'+info+'</div>':'')
           +(dec?'<div class="brf-gl brf-decl">Decidir hoje</div>'+dec:'');
    } else if(sec.tipo==='fechamento'){
      corpo=sec.linhas.map(function(L){
        var m=semMarca(L).match(/^([^:]{2,34}):\s*(.+)$/);
        return '<div class="brf-lin">'
          +(m?'<em>'+esc(m[1])+'</em><span>'+inl(m[2])+'</span>':'<span>'+inl(L)+'</span>')
          +'</div>';}).join('');
    } else {
      corpo=sec.linhas.map(function(L){
        return '<div class="brf-lin"><span>'+inl(L)+'</span></div>';}).join('');
    }
    return '<div class="brf-c brf-'+sec.tipo+(sec.tipo==='alerta'?' al':'')+'">'
      +'<div class="brf-ct"><span class="brf-ic">'+ICONE[sec.tipo]+'</span>'+esc(tituloLimpo(sec.titulo))+'</div>'+corpo+'</div>';
  }

  function render(md){
    var linhas=String(md||'').split(/\r?\n/);
    var cab=[], secoes=[], atual=null;
    for(var i=0;i<linhas.length;i++){
      var L=linhas[i].trim();
      if(!L) continue;
      if(/^([-*_])\1{2,}$/.test(L)) continue;
      var h=L.match(/^#{1,3}\s*(.+)$/);
      if(h){
        var titulo=h[1].trim();
        if(!secoes.length && /^#\s/.test(L) && !atual){ cab.push(titulo); continue; }
        atual={titulo:titulo, tipo:tipoDaSecao(titulo), linhas:[]};
        secoes.push(atual); continue;
      }
      if(!atual){ cab.push(L); continue; }
      atual.linhas.push(L.replace(/^[-*•]\s+/,''));
    }
    if(!secoes.length) return null;

    /* ordem da consulta: em cima o que nao pode passar; a esquerda o que se
       pergunta; a direita o que se olha e o que se decide. Secao de tipo
       desconhecido vai para baixo, na largura toda, para nao sumir. */
    var topo='', esq='', dir='', fim='';
    secoes.forEach(function(sec){
      var h=corpoDaSecao(sec);
      if(sec.tipo==='alerta'||sec.tipo==='foco') topo+=h;
      else if(sec.tipo==='perguntas'||sec.tipo==='fechamento') esq+=h;
      else if(sec.tipo==='dados'||sec.tipo==='conduta') dir+=h;
      else fim+=h;
    });
    return (cab.length ? cabecalho(cab) : '')
      +'<div class="brf-topo">'+topo+'</div>'
      +'<div class="brf-grid"><div class="brf-col brf-esq">'+esq+'</div><div class="brf-col brf-dir">'+dir+'</div></div>'
      +fim;
  }

  var FM = "'DejaVu Sans Mono','IBM Plex Mono',ui-monospace,monospace";
  var CSS = [
  '.brf-cards{font-size:13.4px;line-height:1.5;color:#2B2A26;container-type:inline-size;container-name:brf}',
  /* cabecalho */
  '.brf-cards .cab{background:#1B2745;color:#fff;border-radius:12px;padding:12px 14px;margin:0 0 10px;display:flex;flex-direction:column;gap:6px}',
  '.brf-cards .brf-nome{font-size:16px;font-weight:700;letter-spacing:.01em;line-height:1.25}',
  '.brf-cards .brf-idchips{margin-top:5px;display:flex;flex-wrap:wrap;gap:5px}',
  '.brf-cards .brf-idchips span{font-family:'+FM+';font-size:10px;letter-spacing:.09em;text-transform:uppercase;'
    +'border:1px solid rgba(255,255,255,.32);border-radius:20px;padding:2px 8px}',
  '.brf-cards .brf-lin.cabl{margin:0;font-size:12.6px}',
  '.brf-cards .brf-lin.cabl em{color:rgba(255,255,255,.62)}',
  '.brf-cards .brf-lin.cabl span{color:#fff}',
  /* cartoes */
  '.brf-cards .brf-c{border:1px solid #E4DECB;border-radius:12px;padding:10px 12px 11px;margin:0 0 10px;background:#fff}',
  '.brf-cards .brf-ct{display:flex;align-items:center;gap:7px;font-family:'+FM+';font-size:9.8px;'
    +'letter-spacing:.15em;text-transform:uppercase;color:#9A7B3F;margin:0 0 8px}',
  '.brf-cards .brf-ic{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;'
    +'background:#F5EEDC;color:#9A7B3F;font-size:11px;letter-spacing:0;font-family:inherit}',
  '.brf-cards .brf-c.al{border-color:#E7B9A6;background:#FDF4F0}',
  '.brf-cards .brf-c.al .brf-ct{color:#A63D18}',
  '.brf-cards .brf-c.al .brf-ic{background:#F6D9CC;color:#A63D18}',
  '.brf-cards .brf-al{display:flex;gap:8px;align-items:flex-start;font-size:13.8px;line-height:1.42;'
    +'font-weight:600;color:#7A2E10;margin:0 0 6px}',
  '.brf-cards .brf-al:last-child{margin-bottom:0}',
  '.brf-cards .brf-al i{flex:none;font-style:normal;color:#C4551F}',
  '.brf-cards .brf-al b{font-weight:800}',
  /* roteiro */
  '.brf-cards .brf-passo{display:flex;flex-wrap:wrap;align-items:center;gap:4px}',
  '.brf-cards .brf-passo span{font-family:'+FM+';font-size:10.8px;letter-spacing:.04em;border:1px solid #E4DECB;'
    +'border-radius:20px;padding:4px 10px;background:#FBFAF6;color:#3F3B33}',
  '.brf-cards .brf-passo span b{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;'
    +'background:#1B2745;color:#fff;font-size:9.5px;margin-right:6px}',
  '.brf-cards .brf-passo i{font-style:normal;color:#C9A55E;font-weight:700}',
  /* caixas de marcar */
  '.brf-cards .brf-mk{display:flex;gap:9px;align-items:flex-start;padding:7px 5px;border-radius:7px;'
    +'cursor:pointer;line-height:1.42;-webkit-tap-highlight-color:transparent}',
  '.brf-cards .brf-mk:hover{background:#FBFAF6}',
  '.brf-cards .brf-mk + .brf-mk{border-top:1px solid #F0EDE4}',
  '.brf-cards .brf-mk i,.brf-cards .brf-av>i{flex:none;width:16px;height:16px;margin-top:2px;border:1.5px solid #C9A55E;'
    +'border-radius:4px;font-style:normal;font-size:11px;line-height:14px;text-align:center;color:transparent}',
  '.brf-cards .brf-mk.ok i,.brf-cards .brf-av.ok>i{background:#C9A55E;color:#fff}',
  '.brf-cards .brf-mk.ok{opacity:.45;text-decoration:line-through}',
  '.brf-cards .brf-mk b{font-weight:700}',
  '.brf-cards .brf-mk u{text-decoration:none;color:#6E6A60}',
  /* dados */
  '.brf-cards .brf-grupo{margin:0 0 8px}',
  '.brf-cards .brf-grupo:last-child{margin-bottom:0}',
  '.brf-cards .brf-gl{font-family:'+FM+';font-size:9.4px;letter-spacing:.12em;text-transform:uppercase;'
    +'color:#98917F;margin:0 0 5px}',
  '.brf-cards .brf-chips{display:flex;flex-wrap:wrap;gap:5px}',
  '.brf-cards .brf-chip{font-size:12.6px;border:1px solid #E4DECB;border-radius:7px;padding:3px 8px;'
    +'background:#fff;white-space:nowrap;color:#4A463E;max-width:100%}',
  '.brf-cards .brf-chip.longo{white-space:normal}',
  '.brf-cards .brf-chip b{font-weight:700;color:#2B2A26}',
  '.brf-cards .brf-chip.at{border-color:#EBD9BE;background:#FCF3E8;color:#7A4A1E}',
  '.brf-cards .brf-chip.at b{color:#7A4A1E}',
  '.brf-cards .brf-frase{font-size:12.9px;line-height:1.45;margin:0 0 7px;color:#3F3B33}',
  '.brf-cards .brf-frase.at{color:#7A4A1E}',
  '.brf-cards .brf-frase i{font-style:normal;color:#C4551F}',
  '.brf-cards .brf-sep{height:1px;background:#F0EDE4;margin:10px 0}',
  /* exames */
  '.brf-cards .brf-ex{margin:0 0 8px}',
  '.brf-cards .brf-ext{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}',
  '.brf-cards .brf-exi{border:1px solid #E4DECB;border-radius:9px;padding:5px 9px;background:#FBFAF6;display:flex;flex-direction:column;line-height:1.25}',
  '.brf-cards .brf-exi em{font-style:normal;font-family:'+FM+';font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#98917F}',
  '.brf-cards .brf-exi b{font-size:13.4px;color:#1B2745}',
  '.brf-cards .brf-exi small{font-size:10.5px;color:#9A5A1E}',
  '.brf-cards .brf-exi.velho{border-color:#EBD9BE;background:#FCF3E8}',
  '.brf-cards .brf-exi.nada b{color:#B5AE9E;font-weight:500}',
  '.brf-cards .brf-av{display:flex;gap:9px;align-items:flex-start;border:1.5px solid #9DB3D6;background:#EEF3FB;'
    +'border-radius:10px;padding:8px 10px;margin:0 0 8px;cursor:pointer}',
  '.brf-cards .brf-av>i{border-color:#4A6797}',
  '.brf-cards .brf-av.ok>i{background:#4A6797}',
  '.brf-cards .brf-av.ok{opacity:.5}',
  '.brf-cards .brf-avt{font-weight:800;color:#1B2745;margin:0 0 4px}',
  '.brf-cards .brf-chip.av{border-color:#C6D3E8;background:#fff;color:#1B2745;font-weight:600}',
  '.brf-cards .brf-av small{display:block;margin-top:4px;font-size:11px;color:#55688A}',
  '.brf-cards .brf-ped{display:flex;gap:8px;align-items:flex-start;border:1px solid #EBD9BE;background:#FCF3E8;'
    +'border-radius:10px;padding:7px 10px;margin:0 0 8px;color:#7A4A1E;font-size:13px}',
  '.brf-cards .brf-ped.forte{border-color:#E7B9A6;background:#FDF0EA;color:#8A3414}',
  '.brf-cards .brf-ped i{font-style:normal}',
  /* medicacoes */
  '.brf-cards .brf-meds{border:1px solid #F0EDE4;border-radius:9px;overflow:hidden;margin:0 0 10px}',
  '.brf-cards .brf-med{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 10px;font-size:13px}',
  '.brf-cards .brf-med + .brf-med{border-top:1px solid #F0EDE4}',
  '.brf-cards .brf-med.urg{background:#FDF6F2}',
  '.brf-cards .brf-med.vazio{color:#98917F}',
  '.brf-cards .brf-mn{min-width:0}',
  '.brf-cards .brf-ms{display:flex;gap:4px;flex:none;flex-wrap:wrap;justify-content:flex-end}',
  '.brf-cards .brf-selo{font-family:'+FM+';font-size:9.8px;letter-spacing:.04em;border-radius:20px;padding:2px 8px;'
    +'background:#F3F1EA;color:#6E6A60;white-space:nowrap}',
  '.brf-cards .brf-selo.urg{background:#F9DCCF;color:#8A3414;font-weight:700}',
  '.brf-cards .brf-selo.ama{background:#FBEBCB;color:#7A4A1E}',
  '.brf-cards .brf-info{margin:0 0 4px}',
  '.brf-cards .brf-decl{margin-top:10px;color:#1B2745}',
  '.brf-cards .brf-mk.dec{border:1px solid #E4DECB;border-radius:8px;margin:0 0 5px;padding:6px 8px}',
  '.brf-cards .brf-mk.dec + .brf-mk.dec{border-top:1px solid #E4DECB}',
  /* linhas rotuladas */
  '.brf-cards .brf-lin{display:flex;gap:10px;font-size:12.9px;line-height:1.45;margin:0 0 6px}',
  '.brf-cards .brf-lin:last-child{margin-bottom:0}',
  '.brf-cards .brf-lin em{flex:none;font-style:normal;font-family:'+FM+';font-size:9.2px;letter-spacing:.1em;'
    +'text-transform:uppercase;color:#98917F;padding-top:3px;width:120px}',
  '.brf-cards .brf-lin.at span{color:#7A4A1E}',
  '.brf-cards .brf-lin.fim span{color:#8A3414}',
  '.brf-cards .brf-lin i.w{font-style:normal;color:#C4551F}',
  /* fechamento */
  '.brf-cards .brf-fechamento{background:#FBFAF6}',
  /* coluna unica (painel estreito): as duas colunas se desfazem e o fechamento vai para o fim,
     na ordem da consulta: perguntar, dados, decidir, fechamento */
  '.brf-cards .brf-grid{display:flex;flex-direction:column}',
  '.brf-cards .brf-col{display:contents}',
  '.brf-cards .brf-grid .brf-fechamento{order:9}',
  /* DUAS COLUNAS quando o container e largo (a pagina de briefings em tela cheia).
     O painel do motor, estreito, continua uma coluna so. */
  '@container brf (min-width: 900px){'
    +'.brf-cards .cab{flex-direction:row;align-items:flex-start;gap:22px}'
    +'.brf-cards .brf-cabt{flex:0 0 38%}'
    +'.brf-cards .brf-cabl{flex:1;display:flex;flex-direction:column;gap:4px;padding-top:2px}'
    +'.brf-cards .brf-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:12px;align-items:start}'
    +'.brf-cards .brf-col{display:block}'
    +'.brf-cards .brf-grid .brf-fechamento{order:0}'
    +'.brf-cards .brf-topo{display:grid;grid-template-columns:minmax(0,1fr);gap:0}'
  +'}',
  /* HAG_BRIEFING_CARDS_v3_1: CELULAR (container de ate 520 px) */
  '@container brf (max-width: 520px){'
    +'.brf-cards{font-size:14.2px}'
    +'.brf-cards .cab{padding:12px 13px}'
    +'.brf-cards .brf-nome{font-size:17px}'
    +'.brf-cards .brf-lin{flex-direction:column;gap:1px;font-size:13.8px;margin:0 0 9px}'
    +'.brf-cards .brf-lin em{width:auto;padding-top:0}'
    +'.brf-cards .brf-lin.cabl{flex-direction:row;gap:8px;font-size:13px;margin:0}'
    +'.brf-cards .brf-lin.cabl em{padding-top:2px;flex:none}'
    +'.brf-cards .brf-c{padding:11px 12px 12px}'
    +'.brf-cards .brf-ct{font-size:10.4px}'
    +'.brf-cards .brf-mk{padding:10px 4px;font-size:14.2px}'
    +'.brf-cards .brf-mk i{width:19px;height:19px;line-height:17px;font-size:12px;margin-top:1px}'
    +'.brf-cards .brf-al{font-size:14.4px}'
    +'.brf-cards .brf-passo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;align-items:stretch}'
    +'.brf-cards .brf-passo i{display:none}'
    +'.brf-cards .brf-passo span{font-family:inherit;font-size:12.8px;line-height:1.25;letter-spacing:0;border-radius:9px;padding:6px 8px;display:flex;align-items:center}'
    +'.brf-cards .brf-passo span b{flex:none}'
    +'.brf-cards .brf-chip{font-size:13.2px;white-space:normal}'
    +'.brf-cards .brf-frase{font-size:13.8px}'
    +'.brf-cards .brf-med{flex-wrap:wrap;gap:4px 10px;padding:8px 10px;font-size:13.8px}'
    +'.brf-cards .brf-exi{padding:6px 8px}'
    +'.brf-cards .brf-exi b{font-size:13.6px}'
  +'}',
  /* HAG_BRIEFING_CARDS_v3_1: TEMA ESCURO OPCIONAL (classe brf-auto), cores do HAG Dr */
  '@media (prefers-color-scheme: dark){'
    +'.brf-cards.brf-auto{color:#E3E6EC}'
    +'.brf-cards.brf-auto .cab{background:#202A44;border:1px solid #33405F}'
    +'.brf-cards.brf-auto .brf-c{background:#202634;border-color:#2E3647}'
    +'.brf-cards.brf-auto .brf-ct{color:#D9B877}'
    +'.brf-cards.brf-auto .brf-ic{background:#2F2A1E;color:#D9B877}'
    +'.brf-cards.brf-auto .brf-c.al{background:#35201F;border-color:#5A302C}'
    +'.brf-cards.brf-auto .brf-c.al .brf-ct{color:#F3A08F}'
    +'.brf-cards.brf-auto .brf-c.al .brf-ic{background:#4A2723;color:#F3A08F}'
    +'.brf-cards.brf-auto .brf-al{color:#F8C9BE}'
    +'.brf-cards.brf-auto .brf-al i{color:#F08D86}'
    +'.brf-cards.brf-auto .brf-passo span{background:#1A1F2B;border-color:#2E3647;color:#D5D9E2}'
    +'.brf-cards.brf-auto .brf-passo span b{background:#C9A55E;color:#14161C}'
    +'.brf-cards.brf-auto .brf-mk:hover{background:#262D3D}'
    +'.brf-cards.brf-auto .brf-mk + .brf-mk{border-top-color:#2E3647}'
    +'.brf-cards.brf-auto .brf-mk.ok i,.brf-cards.brf-auto .brf-av.ok>i{color:#14161C}'
    +'.brf-cards.brf-auto .brf-mk u{color:#9AA1B2}'
    +'.brf-cards.brf-auto .brf-gl,.brf-cards.brf-auto .brf-lin em,.brf-cards.brf-auto .brf-exi em{color:#8D95A8}'
    +'.brf-cards.brf-auto .brf-chip{background:#1A1F2B;border-color:#343D50;color:#C9CED8}'
    +'.brf-cards.brf-auto .brf-chip b{color:#F1F3F7}'
    +'.brf-cards.brf-auto .brf-chip.at{background:#372B17;border-color:#5A4522;color:#E9C083}'
    +'.brf-cards.brf-auto .brf-chip.at b{color:#F2CF95}'
    +'.brf-cards.brf-auto .brf-frase{color:#D5D9E2}'
    +'.brf-cards.brf-auto .brf-frase.at,.brf-cards.brf-auto .brf-lin.at span{color:#E9C083}'
    +'.brf-cards.brf-auto .brf-lin.fim span{color:#F3A08F}'
    +'.brf-cards.brf-auto .brf-sep{background:#2E3647}'
    +'.brf-cards.brf-auto .brf-exi{background:#1A1F2B;border-color:#343D50}'
    +'.brf-cards.brf-auto .brf-exi b{color:#F1F3F7}'
    +'.brf-cards.brf-auto .brf-exi small{color:#E5B569}'
    +'.brf-cards.brf-auto .brf-exi.velho{background:#372B17;border-color:#5A4522}'
    +'.brf-cards.brf-auto .brf-exi.nada b{color:#6C7488}'
    +'.brf-cards.brf-auto .brf-av{background:#1B2A42;border-color:#3D5A86}'
    +'.brf-cards.brf-auto .brf-av>i{border-color:#8DB8F0}'
    +'.brf-cards.brf-auto .brf-av.ok>i{background:#8DB8F0}'
    +'.brf-cards.brf-auto .brf-avt{color:#BFD6F7}'
    +'.brf-cards.brf-auto .brf-chip.av{background:#14213A;border-color:#3D5A86;color:#D6E4F8}'
    +'.brf-cards.brf-auto .brf-av small{color:#9DB3D6}'
    +'.brf-cards.brf-auto .brf-ped{background:#372B17;border-color:#5A4522;color:#E9C083}'
    +'.brf-cards.brf-auto .brf-ped.forte{background:#3A1F22;border-color:#5A302C;color:#F3A08F}'
    +'.brf-cards.brf-auto .brf-meds{border-color:#2E3647}'
    +'.brf-cards.brf-auto .brf-med + .brf-med{border-top-color:#2E3647}'
    +'.brf-cards.brf-auto .brf-med.urg{background:#2E1D20}'
    +'.brf-cards.brf-auto .brf-med.vazio{color:#8D95A8}'
    +'.brf-cards.brf-auto .brf-selo{background:#2A3141;color:#B5BAC6}'
    +'.brf-cards.brf-auto .brf-selo.urg{background:#4A2723;color:#F8C9BE}'
    +'.brf-cards.brf-auto .brf-selo.ama{background:#3F3119;color:#F2CF95}'
    +'.brf-cards.brf-auto .brf-decl{color:#BFD6F7}'
    +'.brf-cards.brf-auto .brf-mk.dec,.brf-cards.brf-auto .brf-mk.dec + .brf-mk.dec{border-color:#343D50}'
    +'.brf-cards.brf-auto .brf-fechamento{background:#1D2230}'
  +'}'
  ].join('\n');

  var injetado=false;
  function injetar(){
    if(injetado) return;
    try{
      var velho=document.getElementById('hag-briefing-cards-css');
      if(velho) velho.parentNode.removeChild(velho);
      var st=document.createElement('style');
      st.id='hag-briefing-cards-css';
      st.textContent=CSS;
      (document.head||document.documentElement).appendChild(st);
      injetado=true;
    }catch(e){}
  }

  raiz.HAGBriefingCards = { render: render, css: CSS, injetar: injetar, versao: 'v3.1' };
})(typeof self !== 'undefined' ? self : this);
