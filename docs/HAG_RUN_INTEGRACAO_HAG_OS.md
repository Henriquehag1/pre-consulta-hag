# HAG RUN integrado ao HAG OS e ao HAG Treino (28/10/2026)

Branch `codex/hag-run-discovery`, a partir de `50acfef`. Nenhuma alteração em produção, no Supabase remoto ou no `main`.

## A. Arquitetura real e onde o HAG RUN se encaixa

**O que o HAG Treino já tem:**
- `treino_HAG.html`: app do paciente. Entra por um link pessoal (`treino_acessos.token`) e usa RPCs para o anônimo validadas pelo token.
- `treino_painel_HAG.html`: painel do médico. Usa o login da equipe (HAGAuth, papel `authenticated`).
- Mesmo Supabase do resto do HAG OS e mesmo repositório publicado no GitHub Pages.

**Login da equipe:** o HAG OS tem 2 logins e nenhuma tabela de papéis; todo login é tratado como equipe. Por isso o vínculo médico-paciente da 0002 só faria sentido com um cadastro de quem é médico.

**Decisão: submódulo do HAG Treino, sem segundo sistema e sem segundo login.**
- Médico: aba **Corrida** no painel do Treino. O painel clínico do HAG RUN é montado ali pelo bridge que já existia, num iframe sem credenciais.
- Paciente: card **Corrida** na aba Programas do app do Treino. Só aparece para quem já tem HAG RUN e usa o mesmo link pessoal. O `hag_run_HAG.html` volta ao Treino com o mesmo link.

## B. Auditoria: achados e correções

| Achado | Risco | Correção |
|---|---|---|
| Não havia processo para criar o vínculo médico-paciente; o host de desenvolvimento inseria direto no banco | Na produção, ou ninguém prescreve ou o vínculo seria criado à mão, sem trilha | Migração 0003: cadastro de médico (só o dono do banco cadastra) e vínculo feito pelo próprio médico, com motivo e auditoria |
| Qualquer login da equipe com vínculo poderia prescrever (o HAG OS não distingue médico de secretária) | Prescrição por quem não é médico | O vínculo só vale para médico cadastrado e ativo, com gatilho no banco que também barra inserção direta. Desativar o médico revoga os vínculos dele na hora. Vínculos anteriores à 0003, de quem não está cadastrado, são revogados |
| `hag_run_HAG.html` não tinha a configuração do Supabase em lugar nenhum; só funcionava nos testes, que a injetavam | Publicada, a página do paciente não carregaria nada | `hag_run_config.js` com a mesma URL e chave pública do `treino_HAG.html`. Teste e desenvolvimento sobrescrevem a configuração |
| Prescrição e escopo digitados em JSON no painel médico | Erro de digitação, uso inviável no consultório | Formulário: avaliação legível, plano por sessões e etapas, bloco repetido, total de tempo, 2 ou 3 sessões em dias não consecutivos (diretriz 4). **Nenhuma dose sugerida:** o formulário começa vazio |
| O servidor exige RPE alvo em toda etapa, mas o painel não avisava | Recusa sem explicação | RPE obrigatório no formulário, com checagem antes de enviar |
| O bridge repassava só "rpc_http_400" quando o servidor recusava | O médico não sabia o motivo (urgência ativa, menor de idade, restrição sem orientação) | O bridge repassa o código curto do servidor e o painel explica em português |
| Orientações do médico só apareciam ao paciente na liberação com restrições | Orientação escrita na liberação comum não chegava ao paciente | Aparecem sempre que existirem |
| Já estava na branch: `treino_HAG.html` mudou o semáforo de prontidão (dor articular 4+ manda **interromper** o treino; prontidão muito baixa manda **adiar**) | Mudança clínica no HAG Treino fora do escopo do HAG RUN | **Mantida, mas precisa da aprovação do Dr. Henrique** antes de ir para o `main` |

**Mantido como estava:**
- Gate clínico, RLS forçada, wrappers `invoker` com funções `definer` em `search_path` fechado.
- Token resolvido no servidor e idempotência por `client_event_id`.
- Gatilho que bloqueia execução sem a última liberação vigente.
- Suspensão e bloqueio por relato.

**Conferido no banco real, só leitura:**
- Nenhum objeto HAG RUN existe em produção.
- `treino_acessos` e `patients` batem com o que as migrações esperam.
- O papel `postgres` tem `BYPASSRLS`, então RLS forçada com funções `definer` funciona como nos testes.

**Diferença de 55 para 48 testes:** no commit `0dd31d0`, os testes das fórmulas antigas de dose e progressão foram removidos ou trocados por testes que conferem o bloqueio (fail-closed), e alguns foram parametrizados. Foi substituição deliberada, não regressão.

## C. Arquivos

**Novos:**
- `supabase/migrations/202610280003_hag_run_clinician_registry.sql`
- `tests/sql/hag_run_clinician_registry.test.sql`
- `tests/ui/hag_run_treino_integracao_e2e.test.js`
- `hag_run_config.js`
- `scripts/patch_hag_run_integracao*.py`

**Alterados:**
- `treino_painel_HAG.html`: aba Corrida.
- `treino_HAG.html`: card Corrida.
- `hag_run_medico.html`: formulário.
- `hag_run_HAG.html`: volta ao Treino, configuração e orientações.
- `hag_run_hag_os_bridge.js`: código de recusa.
- Scripts de teste e setup do ambiente de desenvolvimento.
- Testes de UI atualizados para o formulário.

## D. Banco (0003)

**Tabelas:**
- `hag_run_clinicians`, com RLS forçada e sem grant para a API.
- `hag_run_access_audit`.

**Funções:**
- `hag_run_private.register_clinician` e `hag_run_private.deactivate_clinician`: só o dono do banco executa.
- Para a equipe logada:
  - `hag_run_clinician_me()`;
  - `hag_run_clinician_link_patient(patient, motivo)`;
  - `hag_run_clinician_unlink_patient(patient, motivo)`.

**Gatilho:** `hag_run_access_requires_clinician`.

A migração é aditiva e não redefine nenhuma função da 0001 ou da 0002.

**Processo administrativo para ativar em produção, depois da homologação:**
1. Aplicar 0001, 0002 e 0003.
2. Rodar `select hag_run_private.register_clinician('<uid do login do Dr. Henrique>', 'Dr. Henrique Alves Gonzaga', 'CRM/SP 226530', '<quem cadastrou>');`

## E. Telas

**Médico:** HAG Treino › painel › escolher o paciente › aba **Corrida**.
- Login sem cadastro de médico: aparece o aviso e nenhuma ação clínica.
- Médico sem vínculo: link da corrida (o mesmo link pessoal) e o botão "Vincular paciente", que pede o motivo.
- Médico com vínculo: painel clínico (avaliação, plano vigente, sessões, decisões, nova decisão) e "Desvincular".

**Paciente:** app do Treino › **Programas** › card "Corrida guiada · Rumo aos 5 km".
- O card mostra o estado: Em avaliação médica, Liberada ou Suspensa.
- Toque abre a corrida; "‹ TREINO" volta.

## F. Testes executados (28/10/2026, Mac, só dados fictícios)

| Comando | Resultado |
|---|---|
| `npm run verify` | 48 testes e integridade aprovados |
| `npm run test:postgres` (PostgreSQL 17 efêmero) | Segurança, gate médico, concorrência (2 envios iguais, 1 linha gravada), bloqueio por relato e **registro de médico e vínculo** (secretária sem cadastro barrada, inserção direta barrada, motivo obrigatório, idempotência, desvínculo, desativação que revoga vínculos, 5 linhas de auditoria) aprovados |
| `bash scripts/test-hag-run-supabase-local.sh` (Supabase local) | Advisor do Supabase sem achados. RPC, E2E do paciente, bridge com HAGAuth real e **E2E da integração** aprovados. O E2E da integração cobriu: login sem cadastro barrado; vínculo com motivo; prescrição pelo formulário; liberação com restrições; paciente pelo card do Treino executando e salvando a sessão; médico vendo o histórico e suspendendo; card e servidor refletindo a suspensão; auditoria; nenhum pedido à produção |
| `node tests/ui/hag_run_mobile.test.js` | 320 px, iPhone 13 e 768 px aprovados. O bridge não entrega credenciais ao iframe |
| Regressão do HAG Treino: app (15 verificações) e painel (10), antes e depois | Resultados idênticos e zero erro de página |
| `npm run dev:hag-os` e `setup-db` (ambiente persistente) | Sobe, aplica a 0003, cadastra o médico fictício e responde HTTP 200 no host e no painel |

O E2E do HAG Treino simula as RPCs e tabelas do Treino, que não existem no Supabase local. As do HAG RUN são reais.

## G. Pendências reais

**Clínicas (do Dr. Henrique):**
- MED-02, 03, 10 a 14, 20, 22, 23 e 26.
- Doses R0 a R4 e regras de progressão. Enquanto não houver regra aprovada, a adaptação automática fica desligada e a dose só muda por nova decisão.
- Aprovar ou recusar a mudança do semáforo de prontidão no `treino_HAG.html`.

**Técnicas, antes de produção:**
- Teste em iPhone e Android físicos.
- Ambiente local com o schema do HAG Treino para o painel rodar sem simulação. Dá para extrair só a estrutura do banco real, sem dados.
- Merge com o `main` atual. Desde a base da branch, entraram a carga digitável e a checagem do HAG OS.
- Aplicação das migrações em produção e cadastro do médico, só com autorização de publicação.
