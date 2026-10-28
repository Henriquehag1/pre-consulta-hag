# HAG RUN, identidade, autorização e persistência

Data: 27/10/2026
Branch: `codex/hag-run-discovery`
Status: implementação local, sem aplicação em banco.

## Investigação do HAG Treino existente

- O painel autenticado solicita `hag_treino_link(p_patient_id)` e monta o endereço pessoal `treino_HAG.html?t=<token>`.
- `treino_acessos.token` é `text`, gerado por `encode(gen_random_bytes(24), 'hex')`, portanto contém 192 bits aleatórios. A tabela tem `patient_id`, `ultimo_uso` e `revogado`. O token é único e referencia o paciente.
- `hag_treino_link(text)` é `SECURITY DEFINER`, executável por `authenticated`, não por `anon`. Seu corpo consulta ou cria o token para o `patient_id` fornecido pelo painel. Ele não é uma função de autenticação do paciente.
- A página do paciente encaminha o token para `hag_treino_contexto`, `hag_treino_salvar` e outras RPCs. As definições lidas confirmam que `hag_treino_contexto` e `hag_treino_salvar` procuram `treino_acessos` pelo token exato, rejeitam registros revogados e derivam `patient_id` no servidor. A função de gravação exige `client_id` e já usa isso como chave idempotente em `treino_sessoes`.
- Os RPCs de paciente atuais são `SECURITY DEFINER`, com `search_path=public`, e têm `EXECUTE` para `anon`. O HAG RUN não altera nem substitui esses RPCs. As novas funções usam `search_path=pg_catalog` e nomes de tabela qualificados.
- O token não tem expiração automática no esquema atual. A migração local acrescenta `hag_run_expires_at`, inicialmente `NULL`; as novas RPCs rejeitam tokens revogados ou tokens com essa expiração definida e vencida. `NULL` mantém válidos os links HAG Treino existentes.
- A UI antiga mantém o token em localStorage. O HAG RUN não persiste o token; usa o parâmetro `t` em memória e o envia somente no corpo HTTPS das RPCs.

Inspeção da dashboard foi somente leitura no projeto `main PRODUCTION`. Consultas de catálogo, privilégios e código de função foram executadas. Nenhuma tabela foi consultada por linhas de pacientes, nenhum snippet foi salvo e nenhuma migração ou escrita de dados foi executada.

## Decisão de arquitetura

O paciente continua sem criar conta. O token pessoal existente funciona como segredo portador. Cada operação HAG RUN envia somente esse token, nunca um `patient_id`. A RPC resolve o token ativo em `treino_acessos` e deriva o paciente internamente em cada chamada. A alteração de IDs de URL ou payload não participa da autorização. Como o HAG OS já entrega o token em `?t=`, o endereço continua visível no histórico do navegador; o HAG RUN não o grava em `localStorage` e define `Referrer-Policy: no-referrer` para não encaminhá-lo a recursos externos. A equipe deve revogar o token se o link for exposto.

As tabelas novas têm `patient_id` como vínculo interno, chaves estrangeiras compostas que impedem associar uma prescrição ou execução ao programa de outro paciente, RLS habilitada e forçada, e nenhum grant direto para `anon`, `authenticated` ou `public`. As três RPCs públicas são `SECURITY INVOKER`; delegam a funções `SECURITY DEFINER` no schema interno `hag_run_private`. O `EXECUTE` é concedido apenas a `anon`, e o schema interno deve permanecer fora das schemas expostas pela Data API. Leitura e gravação passam pela validação do token no servidor. A chave usada pelo navegador é somente a chave publicável anon. O adaptador rejeita JWT com `role=service_role`.

Programa, dados da avaliação, perfil funcional e snapshots de prescrição são persistidos separadamente das execuções. Snapshots de prescrição não são atualizados por conflito; uma mudança gera novo snapshot. Uma execução é vinculada a uma sessão existente na prescrição daquele mesmo paciente. Cada tentativa usa UUID de idempotência, e uma repetição da requisição com o mesmo UUID retorna o mesmo registro. O contexto reidrata até 200 sessões anteriores, o plano mais recente e a semana vigente.

Snapshots de prescrição são imutáveis e só podem ser acrescentados na semana atual ou na semana seguinte após uma recomendação de progressão derivada pelo servidor dos registros persistidos. A recomendação enviada pelo cliente não é aceita pelo RPC. Uma execução deve corresponder a sessão existente na prescrição vigente daquele paciente.

Os novos RPCs não dão acesso à equipe clínica. Uma interface profissional precisará de autorização autenticada de equipe e escopo de paciente documentado antes de ser adicionada. A avaliação e o plano neste módulo continuam sendo produzidos pelo motor HAG RUN no navegador; a validação clínica do algoritmo e a execução do plano continuam responsabilidades próprias do produto.

## Expiração e revogação

A revogação continua usando `treino_acessos.revogado`. A expiração HAG RUN é opcional e específica à nova integração. Não foi criado um mecanismo cliente para definir ou estender expiração, pois esse ato exige uma rota autenticada da equipe. Até que essa rota exista, os links existentes continuam sem prazo automático. Um token inválido, revogado ou vencido recebe a mesma resposta genérica.

## Migração e ambiente

`supabase/migrations/202610270001_hag_run.sql` é aditiva, preserva tabelas e histórico existentes, não apaga registros e não modifica as RPCs `hag_treino_*`. A migração nunca foi aplicada a projeto remoto. A seção de homologação abaixo registra os testes posteriores em stack Supabase local, PostgreSQL temporário e dados sintéticos.

## Testes e limites de verificação

O relatório inicial desta decisão descrevia somente testes Node simulados. Essa limitação foi resolvida localmente em 27/10/2026; o resultado final aparece abaixo e em [HAG_RUN_HOMOLOGACAO.md](docs/HAG_RUN_HOMOLOGACAO.md).

Para demonstração local sem banco:

```sh
cd "/Users/henriquealvesgonzaga/Library/Mobile Documents/com~apple~CloudDocs/Profissional/HAG_RUN_dev"
python3 -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/hag_run_HAG.html`. Sem configuração Supabase e sem token, o formulário funciona em modo de demonstração e não sincroniza dados. Para validar persistência, configure a URL e a chave anon de um projeto Supabase isolado, aplique a migração somente nesse projeto e acesse com token fictício. Não use dados reais de pacientes.

## Homologação posterior, 27/10/2026

- `npm run verify`: 48 testes Node aprovados e verificação de integridade aprovada.
- `npm run test:postgres`: PostgreSQL 17 efêmero, fixtures sintéticas, autorização e gravações concorrentes aprovadas.
- `npm run test:supabase`: stack local Supabase/PostgREST com migração temporária, Database Advisors sem issues e chamadas RPC reais aprovadas.
- `npm run test:ui`: interface verificada em 320 px, emulação iPhone 13 e 768 px, com duração do cronômetro conferida.
- A revisão encontrou e corrigiu divergência de progressão entre cliente e servidor, validação de valores fracionários, cálculo de pace R5 fora do intervalo e perda da chave idempotente em recarga.
- A aprovação clínica e a conexão de desenvolvimento ao host HAG Treino permanecem pendentes. Veja [HAG_RUN_HOMOLOGACAO.md](docs/HAG_RUN_HOMOLOGACAO.md).
- Nenhuma migration, query de dados, escrita, secret, deploy ou publicação foi feita em projetos remotos; `main` não foi modificada.

## Atualização de implementação, 27/10/2026

A versão seguinte acrescenta um gate médico e não aplica os limiares numéricos ainda pendentes:

- hag_run_HAG.html exige oito respostas de triagem e encaminha avaliação pelo token do link pessoal. Não apresenta nem inicia uma prescrição gerada no navegador antes da autorização médica.
- hag_run_policy.js implementa estados de segurança e resultados conservadores. Desconhecido, resposta faltante, sintoma ou evidência incompleta não libera progressão. O módulo não define limiares universais de carga.
- hag_run_store.js usa hag_run_patient_context_v2 e hag_run_patient_submit_assessment; identificadores de paciente continuam ausentes das chamadas do paciente. A compatibilidade saveAssessment encaminha somente uma solicitação, sem salvar o plano recebido do cliente.
- A migração aditiva 202610270002_hag_run_medical_gate.sql adiciona pedidos, vínculo profissional por paciente, autorizações e auditoria. O profissional precisa ter sessão Supabase autenticada e vínculo ativo validado por auth.uid() no servidor. A RPC do paciente deriva escopo pelo token HAG Treino. RLS fica habilitada e forçada, sem grants diretos às tabelas.
- A prescrição autorizada é fornecida pelo médico no painel hag_run_medico.html. A migração grava o plano e o escopo como snapshots. A adaptação automática permanece desativada por padrão e as RPCs antigas que permitiam ao paciente enviar uma prescrição foram revogadas.
- O RPC recusa liberar corrida quando a solicitação contém sintoma de urgência ainda ativo ou quando o escopo não declara `running_allowed: true`; a pendência permanece para nova decisão após resolução e revisão.
- A saída antiga do motor e da RPC de execução não é suficiente para avançar ciclo. O paciente não recebe botão de avanço automático. Uma mudança de dose depende de nova decisão clínica e registro auditável.
- O painel ainda depende de integração do HAG OS para injetar temporariamente URL, chave publicável e access token autenticado, e de provisionamento administrativo do vínculo profissional com o paciente. Não inserir esse vínculo pelo navegador.
- A autorização local é vinculada ao paciente e ao plano salvo. Revogação é registrada em nova linha de autorização com decisão suspended; não há interface para revogar individualmente token HAG Treino nem prazo automático universal.

Essa implementação é uma barreira técnica e um fluxo de revisão, não homologação clínica. R0–R4, doses, critérios quantitativos de adaptação, orientação completa de urgência, retorno pós-doença/lesão, escopo granular de restrições e critérios adicionais de elegibilidade adulta continuam exigindo regras aprovadas. A interface e o RPC bloqueiam autorização para menores de 18 anos. A demonstração local não persiste dados. Nenhuma alteração foi aplicada ao HAG OS de produção, ao Supabase remoto, à branch `main` ou ao site.
