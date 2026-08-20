/* ============================================================================
   HAG OS · Camada de login (Supabase Auth) — Fase 2 do plano de segurança
   ----------------------------------------------------------------------------
   - NÃO quebra o app enquanto o RLS estiver desligado: se ninguém logar, as
     chamadas seguem usando a chave publishable (comportamento atual).
   - Quando há sessão, injeta o token do usuário no header Authorization de
     TODAS as chamadas ao Supabase (via wrapper de fetch), o que faz o RLS
     "apenas autenticados" liberar o acesso.
   - Login obrigatório só quando window.HAG_CFG.EXIGIR_LOGIN === true
     (ou window.HAG_EXIGIR_LOGIN === true). Ligue isso junto com o RLS.

   API: window.HAGAuth.{ token, valid, login, logout, refresh, mount, patchFetch, session }
   ============================================================================ */
(function(){
  'use strict';
  var SKEY = 'hag_auth_session';
  var origFetch = (typeof window.fetch === 'function') ? window.fetch.bind(window) : null;

  function cfg(){
    var C = window.HAG_CFG || {};
    return {
      url: C.SUPA_URL || window.SUPABASE_URL || window.SUPA_URL || '',
      key: C.SUPA_KEY || window.SUPABASE_KEY || window.SUPA_KEY || ''
    };
  }
  function enforced(){
    return !!((window.HAG_CFG && window.HAG_CFG.EXIGIR_LOGIN) || window.HAG_EXIGIR_LOGIN);
  }

  /* ── sessão ──────────────────────────────────────────────────────────── */
  function getSession(){ try{ return JSON.parse(localStorage.getItem(SKEY)||'null'); }catch(e){ return null; } }
  function setSession(s){ try{ localStorage.setItem(SKEY, JSON.stringify(s)); }catch(e){} }
  function clearSession(){ try{ localStorage.removeItem(SKEY); }catch(e){} }
  /* também reaproveita a sessão do supabase-js (login feito no dashboard) — "um login para tudo" */
  function _projectRef(){ try{ return new URL(cfg().url).hostname.split('.')[0]; }catch(e){ return null; } }
  function _sbSession(){
    try{
      var ref=_projectRef(); if(!ref) return null;
      var raw=localStorage.getItem('sb-'+ref+'-auth-token'); if(!raw) return null;
      var o=JSON.parse(raw); var s=o.currentSession||o;
      if(!s || !s.access_token) return null;
      var expMs = s.expires_at ? s.expires_at*1000 : (o.expiresAt ? o.expiresAt*1000 : 0);
      return { access_token:s.access_token, refresh_token:s.refresh_token, expires_at:expMs, user:(s.user&&s.user.email)||'' };
    }catch(e){ return null; }
  }
  function _live(s){ return !!(s && s.access_token && s.expires_at && Date.now() < (s.expires_at - 5000)); }
  function _effective(){ var a=getSession(); if(_live(a)) return a; var b=_sbSession(); if(_live(b)) return b; return null; }
  function _anyRefresh(){ var a=getSession(); if(a&&a.refresh_token) return a.refresh_token; var b=_sbSession(); return b&&b.refresh_token; }
  function valid(){ return !!_effective(); }
  function token(){ var e=_effective(); return e?e.access_token:null; }

  /* ── auth REST (usa fetch original, sem o wrapper) ───────────────────── */
  function _postAuth(path, body){
    var c=cfg();
    if(!c.url || !c.key) return Promise.reject(new Error('Configuração do Supabase ausente (SUPA_URL/SUPA_KEY).'));
    var f = origFetch || window.fetch;
    return f(c.url+'/auth/v1/'+path, {
      method:'POST',
      headers:{ 'apikey':c.key, 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); });
  }
  function login(email, password){
    return _postAuth('token?grant_type=password', {email:email, password:password}).then(function(res){
      if(!res.ok || !res.j.access_token){
        throw new Error(res.j.error_description || res.j.msg || res.j.message || 'E-mail ou senha inválidos.');
      }
      setSession({
        access_token: res.j.access_token,
        refresh_token: res.j.refresh_token,
        expires_at: Date.now() + ((res.j.expires_in||3600)*1000),
        user: (res.j.user && res.j.user.email) || email
      });
      return res.j;
    });
  }
  function refresh(){
    var rt=_anyRefresh();
    if(!rt) return Promise.resolve(false);
    var prevUser=(getSession()&&getSession().user)||(_sbSession()&&_sbSession().user)||'';
    return _postAuth('token?grant_type=refresh_token', {refresh_token:rt}).then(function(res){
      if(res.ok && res.j.access_token){
        setSession({ access_token:res.j.access_token, refresh_token:res.j.refresh_token,
          expires_at: Date.now()+((res.j.expires_in||3600)*1000), user:(res.j.user&&res.j.user.email)||prevUser });
        return true;
      }
      return false;
    }).catch(function(){ return false; });
  }
  function logout(){ clearSession(); try{ location.reload(); }catch(e){} }

  /* ── wrapper de fetch: injeta o token nas chamadas ao Supabase REST ──── */
  function _setHeader(init, name, val){
    var h = init.headers;
    if(h && typeof window.Headers==='function' && h instanceof window.Headers){ h.set(name, val); return; }
    var obj = {};
    if(h){ if(typeof h.forEach==='function'){ h.forEach(function(v,k){obj[k]=v;}); } else { for(var k in h){ if(Object.prototype.hasOwnProperty.call(h,k)) obj[k]=h[k]; } } }
    obj[name]=val; init.headers=obj;
  }
  function patchFetch(){
    if(!origFetch || window.__hagFetchPatched) return;
    window.__hagFetchPatched = true;
    window.fetch = function(input, init){
      try{
        var c = cfg();
        var url = (typeof input==='string') ? input : (input && input.url) || '';
        if(c.url && url.indexOf(c.url)===0 && url.indexOf('/auth/v1/')<0){
          var tk = token();
          /* HAG_AUTOREFRESH_v1: token morto + refresh disponivel -> renova antes
             de buscar, em vez de cair para a chave anonima (que desde o RLS de
             29/07 devolve vazio e ja gerou prontuario sem analise de exames). */
          if(!tk && _anyRefresh()){
            return refresh().then(function(){
              var tk2 = token();
              if(tk2){
                init = init || {};
                _setHeader(init, 'apikey', c.key);
                _setHeader(init, 'Authorization', 'Bearer '+tk2);
              }
              return origFetch(input, init);
            }).catch(function(){ return origFetch(input, init); });
          }
          if(tk){
            init = init || {};
            _setHeader(init, 'apikey', c.key);
            _setHeader(init, 'Authorization', 'Bearer '+tk);
          }
        }
      }catch(e){}
      return origFetch(input, init);
    };
  }

  /* ── tela de login (overlay) ─────────────────────────────────────────── */
  function _css(){
    if(document.getElementById('hagAuthCss')) return;
    var s=document.createElement('style'); s.id='hagAuthCss';
    s.textContent =
      '#hagAuthOv{position:fixed;inset:0;z-index:100000;background:#1A233A;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'
     +'#hagAuthOv .box{background:#fff;border-radius:16px;padding:32px 30px;width:340px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.4)}'
     +'#hagAuthOv .brand{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b89c58;font-weight:700;margin-bottom:4px}'
     +'#hagAuthOv h2{font-family:Georgia,serif;font-size:22px;color:#1A233A;margin:0 0 2px}'
     +'#hagAuthOv .sub{font-size:12.5px;color:#7a8399;margin-bottom:18px}'
     +'#hagAuthOv label{display:block;font-size:11.5px;color:#3d4a63;font-weight:600;margin:10px 0 4px}'
     +'#hagAuthOv input{width:100%;box-sizing:border-box;font-size:14px;padding:10px 12px;border:1px solid #c4cad6;border-radius:9px;background:#f5f4f0;color:#1A233A}'
     +'#hagAuthOv button{width:100%;margin-top:18px;padding:11px;border:none;border-radius:9px;background:#b89c58;color:#fff;font-size:14px;font-weight:700;cursor:pointer}'
     +'#hagAuthOv button:hover{background:#a6883f}#hagAuthOv button:disabled{opacity:.6;cursor:default}'
     +'#hagAuthOv .err{color:#a13232;font-size:12px;margin-top:10px;min-height:14px}'
     +'.hag-auth-badge{position:fixed;top:14px;right:16px;z-index:9000;display:flex;align-items:center;height:34px;max-width:34px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.94);border:1px solid #dde2eb;box-shadow:0 2px 8px rgba(0,0,0,.07);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:11.5px;font-weight:500;color:#7a8399;cursor:pointer;transition:max-width .2s ease,box-shadow .2s ease}'
     +'.hag-auth-badge.aberto{max-width:340px;box-shadow:0 6px 18px rgba(0,0,0,.13)}'
     +'.hag-auth-badge .hab-ini{flex:0 0 34px;width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#b89c58,#9c8244);color:#fff;font-weight:700;font-size:13px;letter-spacing:.02em}'
     +'.hag-auth-badge .hab-txt{white-space:nowrap;padding:0 13px 0 9px}'
     +'.hag-auth-badge .hab-sair{color:#a13232;font-weight:600}'
     +'.hag-auth-badge .hab-sair:hover{text-decoration:underline}'
     +'@media print{.hag-auth-badge{display:none!important}}';
    document.head.appendChild(s);
  }
  function renderBadge(){
    if(document.querySelector('.hag-auth-badge')) return;
    var s=_effective(); if(!s) return;
    _css();
    /* HAG_CONTA_TOPO_v1: conta no canto superior direito, recolhida como circulo
       com a inicial; abre no hover ou clique. Sair so pelo clique em "Sair". */
    var em=String(s.user||'conectado');
    var esc=function(x){ return String(x).replace(/[&<>"']/g,function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); };
    var b=document.createElement('div'); b.className='hag-auth-badge';
    b.title='Conta HAG OS';
    b.innerHTML='<span class="hab-ini">'+esc(em.charAt(0).toUpperCase())+'</span>'
              + '<span class="hab-txt">'+esc(em)+' · <span class="hab-sair">Sair</span></span>';
    var _tm=null, _fixo=false;
    b.addEventListener('mouseenter', function(){
      if(_fixo) return;
      _tm=setTimeout(function(){ b.classList.add('aberto'); }, 500); /* passar o mouse de raspão não abre */
    });
    b.addEventListener('mouseleave', function(){
      clearTimeout(_tm); if(!_fixo) b.classList.remove('aberto');
    });
    b.addEventListener('click', function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('.hab-sair')){
        if(confirm('Encerrar a sessão?')) logout();
        return;
      }
      clearTimeout(_tm); _fixo=!_fixo;
      if(_fixo) b.classList.add('aberto'); else b.classList.remove('aberto');
    });
    document.addEventListener('click', function(ev){
      if(!b.contains(ev.target)){ _fixo=false; b.classList.remove('aberto'); }
    });
    document.body.appendChild(b);
  }
  function renderGate(onOk){
    _css();
    if(document.getElementById('hagAuthOv')) return;
    var ov=document.createElement('div'); ov.id='hagAuthOv';
    ov.innerHTML='<div class="box"><div class="brand">Método HAG</div><h2>HAG OS</h2>'
      +'<div class="sub">Acesso restrito à equipe. Faça login para continuar.</div>'
      +'<label for="hagAuMail">E-mail</label><input id="hagAuMail" type="email" autocomplete="username" autofocus>'
      +'<label for="hagAuPass">Senha</label><input id="hagAuPass" type="password" autocomplete="current-password">'
      +'<button id="hagAuBtn" type="button">Entrar</button>'
      +'<div class="err" id="hagAuErr"></div></div>';
    document.body.appendChild(ov);
    var btn=document.getElementById('hagAuBtn'), err=document.getElementById('hagAuErr');
    function go(){
      var e=(document.getElementById('hagAuMail').value||'').trim();
      var p=document.getElementById('hagAuPass').value||'';
      if(!e||!p){ err.textContent='Preencha e-mail e senha.'; return; }
      btn.disabled=true; btn.textContent='Entrando...'; err.textContent='';
      login(e,p).then(function(){ ov.remove(); renderBadge(); if(typeof onOk==='function') onOk(); else location.reload(); })
        .catch(function(ex){ btn.disabled=false; btn.textContent='Entrar'; err.textContent=ex.message||'Falha no login.'; });
    }
    btn.addEventListener('click', go);
    ov.addEventListener('keydown', function(ev){ if(ev.key==='Enter') go(); });
  }

  /* ── mount: decide se mostra o gate ──────────────────────────────────── */
  function mount(onReady){
    patchFetch();
    if(valid()){ renderBadge(); if(typeof onReady==='function') onReady(); return true; }
    // sessão expirada mas com refresh token (própria OU do supabase-js) → renova silenciosamente
    if(_anyRefresh()){
      return refresh().then(function(ok){
        if(ok){ renderBadge(); if(typeof onReady==='function') onReady(); return true; }
        if(enforced()){ renderGate(onReady); return false; }
        if(typeof onReady==='function') onReady(); return true;
      });
    }
    if(enforced()){ renderGate(onReady); return false; }
    if(typeof onReady==='function') onReady();
    return true; // login opcional: segue com a chave publishable
  }

  /* patcheia o fetch imediatamente (para o token valer já no boot) */
  patchFetch();
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', function(){ try{ mount(); }catch(e){} }); }
  else { try{ mount(); }catch(e){} }

  window.HAGAuth = { token:token, valid:valid, login:login, logout:logout, refresh:refresh, mount:mount, patchFetch:patchFetch, session:getSession, enforced:enforced };
})();
