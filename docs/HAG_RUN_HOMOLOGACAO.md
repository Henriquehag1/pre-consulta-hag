# HAG RUN, relatório de homologação técnica e clínica

Data: 27/10/2026
Branch: `codex/hag-run-discovery`
Escopo: motor R0–R5, interface, adaptador Supabase, migração SQL e testes locais.

## Resultado

A homologação técnica local avançou. O motor, os RPCs e o fluxo de tela passaram nas verificações descritas abaixo. A prontidão clínica permanece **pendente**, portanto esta versão não deve ser liberada para pacientes. Os limiares e as progressões ainda precisam de validação explícita do responsável clínico.

Nenhuma migração foi executada em projeto remoto. A validação de banco usou uma stack Supabase local e temporária, com registros sintéticos. O script destrói essa stack ao terminar.

## Revisão do motor R0–R5

O motor classifica por capacidade contínua, volume e frequência semanal, distância da corrida mais longa e, para R5, objetivo e teste recente. A validade do teste R5 é limitada a resultados de 3 a 10 km nos 90 dias anteriores. A referência de 5 km usa extrapolação de Riegel, não uma promessa de desempenho.

Foram adicionadas validações para frequência semanal fracionária, escala de RPE/dor/fadiga fora de valores inteiros e resultado de prova com pace fora do intervalo aceito pelo motor. Um pace-alvo estimado fora do intervalo aceito passa a usar o pace confortável informado, ou a não exibir pace.

**Ponto clínico a decidir:** R0 e R1 ainda usam exatamente os mesmos intervalos. R0 representa menos de cinco minutos contínuos e R1 representa de cinco a menos de quinze minutos. A equivalência pode ser intencional para a fase inicial, mas precisa ser confirmada; a implementação atual não demonstra individualização entre esses dois grupos.

## Progressão e recuperação

A progressão do navegador agora exige que a sessão atual e a execução persistida imediatamente anterior tenham sido concluídas com dor zero, RPE até 6, fadiga abaixo de 8 e recuperação boa. Uma execução interrompida ou com recuperação inadequada entre duas execuções boas impede avanço. Isso alinha a recomendação local à regra já implementada no RPC.

Sintomas preocupantes, lesão nova ou dor igual ou superior a 4/10 direcionam para revisão profissional. Dor entre 1 e 3/10 impede avanço; fadiga igual ou superior a 8/10, RPE igual ou superior a 9/10 ou recuperação insuficiente recomendam reduzir a carga. A RPC aplica as mesmas categorias e não aceita recomendação de progressão enviada pelo navegador.

## Revisão SQL, autorização e persistência

A migração foi aplicada somente a uma instância local. As chamadas reais passaram por PostgreSQL 17 e PostgREST do Supabase local. O cenário continha dois pacientes fictícios, links ativos, revogado e expirado.

Verificações feitas:

- leitura e gravação passam pelas RPCs, usando somente token portador; nenhum identificador de paciente é aceito como autoridade;
- token inválido, revogado ou expirado é rejeitado;
- paciente B não acessa a prescrição ou sessão de paciente A;
- tabelas HAG RUN têm RLS habilitada e forçada, sem grants diretos para os papéis da API;
- funções públicas são `SECURITY INVOKER`; funções internas validam o token, derivam `patient_id` no banco e usam `search_path` restrito;
- uma prescrição da semana vigente é imutável; avanço de semana exige recomendação persistida de progressão;
- execução não concluída, dor relevante e recuperação insuficiente não autorizam progressão;
- chamadas concorrentes com o mesmo `client_event_id` resultam em uma única execução;
- contexto RPC restaura perfil, prescrição, semana e histórico sintético.

O Supabase Database Advisors não encontrou problemas de segurança ou performance no schema local testado.

## Interface e dispositivos

A interface foi exercitada por Playwright em largura compacta de 320 px, emulação iPhone 13 e largura de tablet de 768 px. Não houve overflow horizontal; os botões visíveis respeitaram a área mínima verificada. O fluxo de avaliação, sessão, cronômetro por etapas, pausa, retomada, salvamento e histórico foi exercitado em modo de demonstração.

A soma do cronômetro foi comparada com os segmentos prescritos e coincidiu dentro de um segundo, incluindo pausa e transição. A chave de idempotência da execução pendente sobrevive a recarga da página na mesma aba e é removida depois de uma confirmação de salvamento.

Esses resultados usam emulação de navegador, não aparelhos físicos. A tela ainda não foi homologada no HAG Treino com um link/token real de paciente sintético e `HAG_RUN_CONFIG` fornecido pelo host.

## Testes executados

- `npm run verify`: 48 testes Node aprovados, mais verificação de integridade dos arquivos.
- `npm run test:postgres`: PostgreSQL 17 temporário; testes SQL com fixture sintética, incluindo concorrência em duas conexões.
- `npm run test:supabase`: stack Supabase local nativa, PostgreSQL, PostgREST, migração, SQL, advisors e duas chamadas RPC concorrentes.
- `npm run test:ui`: emulação mobile em três larguras, com exercício do fluxo e soma temporal.

Os testes PostgreSQL e Supabase são integração real em ambiente local. Eles não comprovam o schema, grants, funções ou configuração de URL do projeto de produção, que não foi acessado nesta homologação.

## Pendências clínicas antes de implantação

1. Aprovar os critérios R0–R5 e decidir se R0 precisa de intervalos distintos de R1.
2. Aprovar o avanço após duas sessões consecutivas e os limiares de RPE, dor, fadiga e recuperação.
3. Avaliar triagem de condições cardiovasculares/metabólicas conhecidas, comorbidades, medicamentos, idade e outros fatores que o formulário ainda não pergunta. O ACSM inclui doença conhecida e sintomas no rastreio pré-participação; a tela atual coleta apenas alguns sintomas e lesão relatada. [ACSM, recomendações de triagem pré-participação](https://journals.lww.com/acsm-msse/fulltext/2015/11000/updating_acsm_s_recommendations_for_exercise.28.aspx)
4. Aprovar o protocolo run-walk, aquecimento, recuperação e progressão de carga. O NHS recomenda repetir uma corrida semelhante três ou quatro vezes antes de aumentar distância ou ritmo; o HAG RUN usa outro critério, que requer avaliação clínica própria. [NHS, lesões relacionadas à corrida](https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/)
5. Definir a conduta de desbloqueio depois de recuperação insuficiente e revisão profissional. No momento, o sistema impede a progressão automática, mas a liberação clínica não está ligada a um fluxo de equipe autenticado.
6. Integrar URL e chave publicável de ambiente isolado ao host HAG Treino e testar o caminho real com token sintético antes de qualquer uso assistencial.

## Segurança e implantação

O `main`, o projeto Supabase remoto, os dados de pacientes e a publicação do aplicativo não foram modificados. A branch de desenvolvimento contém os scripts e fixtures para reproduzir os testes. Não houve instalação de GitHub Apps, criação de tokens ou alteração de secrets/permissões.

## Gate clínico e integração local, 27/10/2026

Esta rodada acrescentou o gate de triagem e autorização médica na migração 202610270002. O paciente envia avaliação pelo token pessoal e não envia plano prescrito. Sem autorização ativa o contexto esconde programa e prescrição. Um novo questionário, dor ou sintoma em execução abre pendência e suspende o acesso ao plano. O endpoint legado de contexto e a RPC legada de autogeração foram revogados. A gravação de execução exige autorização ativa correspondente à prescrição. Adaptação automática fica bloqueada; não houve aprovação dos limiares existentes no motor.

O RPC também bloqueia a liberação quando a solicitação mantém urgência ativa ou quando o escopo não declara explicitamente que a corrida está permitida.

- `npm run verify`: 55 testes unitários/contratuais Node aprovados e integridade aprovada.
- `npm run test:postgres`: PostgreSQL 17 temporário aprovado. Inclui duas gravações concorrentes idempotentes, token e escopo de paciente, vínculo profissional, revisão/autorizações, audit trail, bloqueio ao modificar identificador, autorização revogada por nova triagem e retenção de RLS.
- `npm run test:supabase`: stack Supabase/PostgREST local aprovada, migrações 001 e 002, Advisors sem issues, isolamento de tokens, contextos autorizados, envio pendente, revogação/expiração, persistência e concorrência. Os registros são sintéticos.
- `npm run test:ui`: interface emulada em 320 px, iPhone 13 e 768 px. O paciente sem autorização não vê sessões; plano sintético aprovado abre o timer; duração medida confere exatamente com os segmentos.

Os testes de PostgreSQL e Supabase são integração real contra bancos efêmeros locais, não contra projeto remoto. O teste de UI usa resposta RPC sintética controlada; não é uma sessão clínica real nem aparelho físico. A análise clínica e os parâmetros do motor continuam pendentes.

## Limitações para uso assistencial na homologação anterior ao bridge

Naquela etapa, o HAG OS ainda precisava integrar o painel. A ponte descrita na seção posterior mantém a sessão no host e não envia access token ao iframe. O vínculo clinician_user_id/patient_id deve ser provisionado por processo administrativo confiável e revogável, nunca pelo navegador. Não foi alterado nenhum HTML do HAG OS hospedeiro. Não há provisionamento de equipe, tela de gestão de vínculos, expiração da autorização médica ou edição granular de restrições. O médico precisa informar um plano JSON estruturalmente válido; a migração valida o formato, mas não homologa adequação clínica. R0–R4 e suas matrizes numéricas não estão liberados como algoritmo clínico.

Nenhuma migração foi aplicada a Supabase remoto. Nenhum dado real foi lido ou alterado, não houve mudança em main, merge ou publicação.

## Motor clínico em fail-closed e integração do painel, 27/10/2026

- `npm run verify`: **48 testes Node aprovados** e integridade aprovada. Os testes do motor agora verificam R0–R4 como classificação apenas provisória, bloqueio da geração de sessões, inatividade de R5 e revisão profissional para todos os ciclos enquanto parâmetros clínicos não forem aprovados.
- `npm run test:ui`: Playwright aprovado em 320 px, iPhone 13 e 768 px. O teste do host sintético valida acesso sem sessão, contexto do paciente, envio de decisão clínica e escopo pelo canal RPC, duração do timer e visibilidade das restrições.
- O iframe médico está sandboxed sem `allow-same-origin`. A ponte aceita mensagens somente da janela iframe criada, limita as RPCs a contexto e revisão clínica, mantém o access token no host HAG OS e nunca o repassa ao painel, URL ou armazenamento.
- O HAG OS hospedeiro não foi modificado. A ponte foi preparada e validada em harness local sintético; a inclusão do script no host de desenvolvimento ainda é necessária para ativação real.
- Doses R0–R4, triagem integral e limites de decisão seguem pendentes de homologação médica. A prescrição continua sendo escrita e versionada por um profissional; o motor não ativa fórmulas numéricas antigas.

## Fluxo de paciente no navegador com Supabase local, 27/10/2026

- `npm run test:supabase` agora abre `hag_run_HAG.html` em emulação móvel conectado ao PostgREST da stack temporária. Recupera uma prescrição sintética previamente autorizada pelo fixture SQL, exibe restrições e sessões, executa o timer de 120 segundos em relógio controlado pelo teste e grava a execução pela RPC real.
- Após recarregar a página, o teste confirma que a prescrição e o histórico ampliado foram recuperados do banco local. O ciclo não avança automaticamente.
- O cenário usa somente tokens e pacientes sintéticos; a stack é local e destruída ao fim do script. Não acessa o Supabase remoto.
- A integração com o HAG OS real continua pendente: não há clone de desenvolvimento do host no workspace. O arquivo `hag_run_hag_os_bridge.js` foi exercitado no harness sintético; nenhum HTML operacional do HAG OS foi alterado.

## Bridge com HAGAuth real em host efêmero isolado, 27/10/2026

- Quando `../HAG_Consultas/hag_auth.js` está disponível, `npm run test:supabase` cria um host temporário de desenvolvimento, carrega esse arquivo em modo somente leitura, autentica um usuário profissional sintético no Supabase local e cria o vínculo desse usuário apenas no banco temporário.
- O teste usa o bridge real e os RPCs reais via PostgREST. O profissional carrega o paciente sintético, publica uma prescrição restrita, o paciente executa e persiste uma sessão, o profissional recarrega o histórico e suspende a corrida. O paciente então recebe a suspensão; a auditoria local contém as duas decisões.
- O token autenticado permanece no contexto do host; o teste confirma que o iframe não recebe token nem configuração de credenciais. O cadastro, vínculo, prescrição, execução e auditoria desaparecem quando a stack temporária é destruída.
- Em clones do repositório sem a pasta vizinha `HAG_Consultas`, esse subteste é informado como ignorado; a cobertura de bridge com host sintético continua ativa. Nenhuma página operacional do HAG OS foi modificada. A montagem em uma página de desenvolvimento persistente e os testes em aparelho físico continuam pendentes.
