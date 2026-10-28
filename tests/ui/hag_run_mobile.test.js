'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const root = path.resolve(__dirname, '../..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
function createServer() {
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (pathname === '/hag_os_bridge_fixture.html') {
      const html = `<!doctype html><html><head><meta name="referrer" content="no-referrer"></head><body>
        <div id="mount"></div><script>window.HAG_CFG={SUPA_URL:'https://dev.supabase.co',SUPA_KEY:'public-anon-key'};
        window.HAGAuth={valid:function(){return !location.search.includes('unauth=1')},token:function(){return location.search.includes('service=1')?'header.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature':'header.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.signature'}};
        window.HAGMotor={paciente:{id:'synthetic-patient-a'}};</script>
        <script src="/hag_run_hag_os_bridge.js"></script><script>HAGRunHostBridge.mount(document.getElementById('mount'),{panelUrl:'/hag_run_medico.html'});</script>
      </body></html>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
      return;
    }
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(target, (error, data) => {
      if (error) return res.writeHead(404).end('Not found');
      res.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

async function main() {
  const server=createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  const browser=await chromium.launch({headless:true});
  const errors=[];
  try {
    const viewports=[
      {name:'compact 320px',width:320,height:720,mobile:true},
      {...devices['iPhone 13'],name:'iPhone 13',mobile:true},
      {name:'tablet 768px',width:768,height:1024,mobile:true},
    ];
    for(const viewport of viewports) {
      const context=await browser.newContext({
        viewport:viewport.viewport||{width:viewport.width,height:viewport.height},
        screen:viewport.screen,deviceScaleFactor:viewport.deviceScaleFactor||2,isMobile:viewport.mobile,hasTouch:true,
      });
      const page=await context.newPage();
      page.on('pageerror',error=>errors.push(viewport.name+': '+error.message));
      await page.route('https://fonts.googleapis.com/**',route=>route.abort());
      await page.addInitScript(()=>{let clock=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});window.advanceHagTimer=ms=>{clock+=ms;};});
      await page.goto('http://127.0.0.1:'+address.port+'/hag_run_HAG.html');
      await page.getByText(/Modo de demonstração/).waitFor();
      const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(dimensions.scroll<=dimensions.width,viewport.name+' has horizontal overflow: '+JSON.stringify(dimensions));
      const buttons=await page.locator('button').evaluateAll(items=>items.filter(item=>item.getClientRects().length).map(item=>item.getBoundingClientRect().height));
      assert.ok(buttons.every(height=>height>=44),viewport.name+' has a tap target below 44px');
      await page.locator('#continuous').fill('0');
      const isMinor=viewport.name==='iPhone 13';
      await page.locator('#ageYears').fill(isMinor?'17':'35');
      await page.locator('#days').fill('0');
      await page.locator('#weekly').fill('0');
      await page.locator('#longest').fill('0');
      await page.locator('#painNow').fill('0');
      await page.locator('#availableDays input[value="mon"]').check();
      await page.locator('#availableDays input[value="wed"]').check();
      await page.locator('[data-triage]').evaluateAll(items=>items.forEach(item=>item.value='no'));
      await page.getByRole('button',{name:'Enviar para revisão clínica'}).click();
      await page.getByRole('heading',{name:'Avaliação enviada para revisão clínica'}).waitFor();
      if(isMinor) await page.getByText(/Triagem AMARELO/).waitFor();
      assert.equal(await page.locator('[data-start]').count(),0,'patient cannot start a plan before clinician authorization');
      await context.close();

      // Reopen through a synthetic physician-authorized context to exercise the guided timer.
      const approvedContext=await browser.newContext({
        viewport:viewport.viewport||{width:viewport.width,height:viewport.height},
        screen:viewport.screen,deviceScaleFactor:viewport.deviceScaleFactor||2,isMobile:viewport.mobile,hasTouch:true,
      });
      const approved=await approvedContext.newPage();
      approved.on('pageerror',error=>errors.push(viewport.name+' approved: '+error.message));
      await approved.addInitScript(()=>{let clock=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});window.advanceHagTimer=ms=>{clock+=ms;};window.HAG_RUN_CONFIG={url:'https://dev.supabase.co',anonKey:'public-anon-key',token:'a'.repeat(48)};});
      const plan={engineVersion:'clinician-authored-v1',status:'ready',week:1,classification:{level:'R0',reviewReasons:[]},sessions:[{id:'approved-session',day:'mon',title:'Sessão sintética autorizada',level:'R0',objective:'Plano sintético revisado.',modality:'road',durationSeconds:360,durationMinutes:6,segments:[{type:'warmup_walk',seconds:60,rpeTarget:2},{type:'run',seconds:120,rpeTarget:3},{type:'cooldown_walk',seconds:180,rpeTarget:2}]}]};
      await approved.route('https://dev.supabase.co/rest/v1/rpc/**',async route=>{
        if(route.request().method()==='OPTIONS') return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'apikey,authorization,content-type'}});
        const url=route.request().url();
        const headers={'access-control-allow-origin':'*','content-type':'application/json'};
        if(url.endsWith('hag_run_patient_context_v2')) return route.fulfill({headers,json:{ok:true,program:null,prescription:null,history:[],pending_review:false,medical_authorization:{id:'auth-synthetic',decision:'released_with_restrictions',scope:{running_allowed:true,adaptation_allowed:false,patient_instructions:'Mantenha o esforço leve e interrompa se surgir dor.'},authorized_plan:plan}}});
        if(url.endsWith('hag_run_patient_save_execution')) return route.fulfill({headers,json:{ok:true,execution_id:'execution-synthetic',duplicate:false,recommendation:{action:'maintain',progressAllowed:false}}});
        return route.fulfill({status:404,headers,json:{ok:false,error:'not_found'}});
      });
      await approved.goto('http://127.0.0.1:'+address.port+'/hag_run_HAG.html?t='+('a'.repeat(48)));
      await approved.waitForTimeout(300);
      if(await approved.getByRole('heading',{name:'Plano Rumo aos 5 km'}).count()===0) throw new Error('authorized synthetic plan was not restored: '+await approved.locator('#saveStatus').textContent());
      await approved.getByText('Mantenha o esforço leve e interrompa se surgir dor.').waitFor();
      assert.equal(await approved.locator('[data-start]').count(),1);
      if(viewport.name==='compact 320px') {
        const session=approved.locator('#plan article.session');
        const planned=await session.locator('.segment b').allTextContents();
        const total=planned.reduce((sum,text)=>{const parts=text.split(':').map(Number);return sum+parts[0]*60+parts[1];},0);
        await session.getByRole('button',{name:'Iniciar esta sessão'}).click();
        await approved.getByText('Aquecimento caminhando',{exact:true}).waitFor();
        for(const label of planned) {
          const parts=label.split(':').map(Number);
          await approved.evaluate(seconds=>window.advanceHagTimer(seconds*1000),parts[0]*60+parts[1]);
          await approved.waitForTimeout(220);
        }
        await approved.getByRole('heading',{name:'Sessão concluída'}).waitFor();
        assert.ok(Math.abs(Number(await approved.locator('#actualTime').inputValue())*60-total)<=1,'timer must match the prescribed segment total');
        await approved.locator('#distance').fill('1');
        await approved.getByRole('button',{name:'Salvar execução'}).click();
        await approved.getByText(/Ciclo completo registrado/).waitFor();
        assert.equal(await approved.locator('#followup').isVisible(),false,'no automatic progression button is exposed');
      }
      await approvedContext.close();
    }
    const hostContext=await browser.newContext();
    const hostPage=await hostContext.newPage();
    const clinicianRequests=[];
    await hostPage.route('https://dev.supabase.co/rest/v1/rpc/**',async route=>{
      const request=route.request();
      if(request.method()==='OPTIONS') return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'apikey,authorization,content-type'}});
      clinicianRequests.push({url:request.url(),headers:request.headers(),body:request.postDataJSON()});
      const isReview=request.url().endsWith('/hag_run_clinician_review');
      await route.fulfill({status:200,contentType:'application/json',json:isReview
        ?{ok:true,authorization_id:'auth-synthetic',prescription_id:'rx-synthetic',decision:'released'}
        :{ok:true,request:{id:'synthetic-request'},program:null,prescription:null,history:[],authorization_history:[]}});
    });
    await hostPage.goto('http://127.0.0.1:'+address.port+'/hag_os_bridge_fixture.html');
    const panel=hostPage.frameLocator('iframe[title="Painel médico HAG RUN"]');
    await panel.getByText(/Canal autenticado do HAG OS conectado/).waitFor();
    assert.equal(await panel.locator('#patientId').inputValue(),'synthetic-patient-a');
    const panelFrame=hostPage.frames().find(frame=>frame.url().includes('hag_run_medico.html'));
    const panelUrl=new URL(panelFrame.url());
    assert.equal(panelUrl.searchParams.has('access_token'),false,'access token must not be placed in the panel URL');
    assert.equal(panelUrl.searchParams.has('apikey'),false,'Supabase key must not be placed in the panel URL');
    assert.equal(await panelFrame.evaluate(()=>window.HAG_RUN_CLINICIAN_CONFIG||null),null,'the iframe must not receive an access token config');
    assert.match(await hostPage.locator('iframe').getAttribute('sandbox'),/allow-scripts/);
    assert.doesNotMatch(await hostPage.locator('iframe').getAttribute('sandbox'),/allow-same-origin/);
    await panel.getByRole('button',{name:'Carregar contexto autorizado'}).click();
    await panel.getByText('Solicitação carregada. Revise os dados e registre uma decisão.').waitFor();
    assert.equal(clinicianRequests[0].url.endsWith('/hag_run_clinician_context'),true);
    assert.match(clinicianRequests[0].headers.authorization,/^Bearer header\.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9\.signature$/);
    assert.deepEqual(clinicianRequests[0].body,{p_patient_id:'synthetic-patient-a'});
    await panel.locator('#scope').fill(JSON.stringify({running_allowed:true,adaptation_allowed:false,patient_instructions:'Plano sintético revisado.'}));
    await panel.locator('#plan').fill(JSON.stringify({week:1,sessions:[{id:'session-synthetic',segments:[{type:'run',seconds:60,rpeTarget:3}]}]}));
    await panel.locator('#reason').fill('Autorização sintética para validar o bridge.');
    await panel.locator('button[data-action="released"]').click();
    await panel.getByText(/Decisão registrada\. Autorização auth-synthetic/).waitFor();
    assert.equal(clinicianRequests[1].url.endsWith('/hag_run_clinician_review'),true);
    assert.deepEqual(clinicianRequests[1].body,{p_patient_id:'synthetic-patient-a',p_decision:'released',
      p_scope:{running_allowed:true,adaptation_allowed:false,patient_instructions:'Plano sintético revisado.'},
      p_plan:{week:1,sessions:[{id:'session-synthetic',segments:[{type:'run',seconds:60,rpeTarget:3}]}]},
      p_reason:'Autorização sintética para validar o bridge.'});
    await hostContext.close();

    const unauthContext=await browser.newContext();
    const unauthPage=await unauthContext.newPage();
    await unauthPage.goto('http://127.0.0.1:'+address.port+'/hag_os_bridge_fixture.html?unauth=1');
    const unauthPanel=unauthPage.frameLocator('iframe[title="Painel médico HAG RUN"]');
    await unauthPanel.getByText('Entre no HAG OS para abrir a revisão clínica.').waitFor();
    await unauthContext.close();
    const serviceContext=await browser.newContext();
    const servicePage=await serviceContext.newPage();
    await servicePage.goto('http://127.0.0.1:'+address.port+'/hag_os_bridge_fixture.html?service=1');
    const servicePanel=servicePage.frameLocator('iframe[title="Painel médico HAG RUN"]');
    await servicePanel.getByText('Entre no HAG OS para abrir a revisão clínica.').waitFor();
    await serviceContext.close();
    assert.deepEqual(errors,[],'browser errors: '+errors.join('; '));
    console.log('Mobile UI passed at 320px, iPhone 13, and 768px. Sandboxed HAG OS panel used a host RPC channel without receiving browser credentials; unauthenticated host access was denied.');
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
