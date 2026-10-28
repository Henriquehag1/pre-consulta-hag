# HAG RUN, motor em desenvolvimento

A interface do paciente está em `hag_run_HAG.html`; a classificação funcional e os registros puros estão em `hag_run_engine.js`; as regras de segurança ficam em `hag_run_policy.js`; o acesso à persistência passa por `hag_run_store.js`; o gate clínico e as RPCs estão em `supabase/migrations/202610270002_hag_run_medical_gate.sql`.

## Estado do motor

- A faixa inicial ativa contempla R0–R4. A classificação retornada pelo código é apenas funcional e provisória. Não autoriza corrida nem libera plano.
- R5 foi removido do conjunto ativo e fica reservado para versão futura.
- `generate5kWeek()` não cria sessões. Retorna `clinical_protocol_pending` até haver matrizes clínicas aprovadas e codificadas.
- `recommendNext()` sempre retorna `professional_review`. Os antigos cálculos de dose semanal, avanço por semana, intervalos e pace estimado foram removidos do motor executável.
- O profissional pode registrar uma prescrição individual no painel. O servidor valida estrutura, faixa etária, escopo de corrida, ausência de urgência ativa, identidade profissional e vínculo individual. A prescrição fica versionada e auditada.
- O paciente executa somente um plano vigente autorizado. O cronômetro respeita a soma prescrita; RPE, dor, fadiga, recuperação e sintomas são registrados separadamente da prescrição.
- Um relato de dor, lesão ou sintoma cria bloqueio e requer revisão. A adaptação automática continua desativada até existir regra aprovada e dentro do escopo autorizado.

## Integração com HAG OS

`hag_run_hag_os_bridge.js` conecta o painel a `HAGAuth` e `HAG_CFG` existentes. O iframe usa sandbox sem `allow-same-origin`; a sessão permanece no host. O painel pede operações RPC por `postMessage`; o host limita as chamadas a `hag_run_clinician_context` e `hag_run_clinician_review`, usa a sessão atual no header HTTP e envia somente a resposta ao iframe. Não envia access token ou chave Supabase ao painel, URL ou armazenamento local. O banco valida `auth.uid()` e vínculo profissional-paciente em cada chamada.

A integração está pronta para inclusão controlada no HAG OS, mas não foi ativada no host. Exemplo do contêiner de desenvolvimento:

```html
<div id="hag-run-medical-panel"></div>
<script src="hag_run_hag_os_bridge.js"></script>
<script>
  HAGRunHostBridge.mount(document.getElementById('hag-run-medical-panel'), {
    panelUrl: '/hag_run_medico.html'
  });
</script>
```

O painel e o host precisam estar na mesma origem. O HAG OS deve ter carregado `hag_auth.js` e definir `HAG_CFG.SUPA_URL` e `HAG_CFG.SUPA_KEY`. O vínculo entre o usuário profissional e o paciente continua sendo provisionado por processo administrativo confiável; o ID recebido pelo painel serve somente para localizar o contexto e nunca concede acesso.

## Rodar localmente

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/hag_run_HAG.html` para demonstração sem persistência. Para testar o bridge, a origem local precisa servir também o fixture sintético existente em `tests/ui/hag_run_mobile.test.js`.

## Verificações

```sh
npm run verify
npm run test:postgres
npm run test:supabase
npm run test:ui
```

`npm run test:supabase` também abre o aplicativo real no Playwright, conecta à stack temporária por PostgREST, executa a sessão de prescrição sintética e confirma a recuperação do histórico após recarga. Os testes do PostgreSQL 17 temporário e da stack Supabase local usam apenas dados sintéticos. A interface usa emulação móvel; não substitui aparelho físico. Nenhum desses scripts aponta para Supabase remoto.

O host HAG OS disponível no workspace é operacional e não há clone persistente de desenvolvimento. O teste local cria um host efêmero isolado, carrega o `hag_auth.js` real em modo somente leitura, autentica um profissional sintético pelo Supabase local e monta o bridge. Não altera o host HAG OS operacional. O fluxo clínico/paciente é exercitado contra PostgREST local; a ativação em uma página de desenvolvimento do HAG OS continua pendente.

## Fora da homologação clínica

Os valores numéricos de dose, os limites R0–R4, as regras de entrada, a interpretação quantitativa da recuperação e os critérios de progressão, manutenção e redução ainda não foram aprovados como protocolo assistencial. Não ativar geração automática para preencher essas lacunas. A prescrição individual atual é escrita pelo profissional e deve ser revisada clinicamente antes de uso com pacientes. Produção, `main`, dados reais e publicação não foram alterados.
