# HAG RUN, desenvolvimento

Implementação inicial independente para Rumo aos 5 km. A interface está em `hag_run_HAG.html`, o motor puro em `hag_run_engine.js`, a persistência opcional em `hag_run_store.js` e a migração aditiva em `supabase/migrations/202610270001_hag_run.sql`.

## O que está pronto

- Avaliação com capacidade contínua, frequência, volume semanal, maior corrida, dias livres, pace conhecido, modalidade, dor e alertas de lesão ou sintomas.
- Resultado recente opcional para individualizar o nível avançado R5 e calcular uma referência de pace. A página aceita testes de 3 a 10 km.
- Classificação funcional R0 a R5 e prescrição da semana 1 em sessões segmentadas, com aquecimento, corrida, caminhada e volta à calma.
- Timer de intervalos, pausa, retomada, pulo de etapa e encerramento. Pular etapas deixa a execução como incompleta. A contagem usa relógio monotônico aproximado por `Date.now()` e recalcula após retorno à aba.
- Registro separado da execução real: conclusão, duração, distância, RPE, dificuldade, dor, fadiga, recuperação, sintomas e nova lesão.
- Progressão local somente após duas sessões recentes bem toleradas. Fadiga alta, recuperação ruim, dor ou sintomas bloqueiam o avanço. A tela informa que o histórico local vive apenas enquanto a página estiver aberta.
- Adaptador de gravação por uma RPC atômica, somente com JWT que contenha `sub`. Programa, prescrição e execução ficam em tabelas próprias.
- Migração cria novas tabelas, força RLS e restringe as políticas a `auth.uid()`. Não altera tabelas nem histórico HAG existentes.

## Classificação operacional

| Nível | Critério principal |
| --- | --- |
| R0 | Menos de 5 minutos contínuos |
| R1 | 5 a menos de 15 minutos contínuos |
| R2 | 15 a menos de 30 minutos contínuos |
| R3 | 30 minutos contínuos, sem critério de R4/R5 |
| R4 | Corrida mais longa de pelo menos 5 km, frequência de 2 dias e volume semanal de 8 km; ou resultado recente de 5 a 10 km |
| R5 | Melhorar 5 km, teste recente de 3 a 10 km, frequência de 3 dias, volume semanal de 15 km e corrida mais longa de pelo menos 5 km |

Lesão ativa/recente, sintomas preocupantes ou dor atual igual ou superior a 4/10 bloqueiam prescrição automática. Dor leve impede progressão automática. A projeção de pace é uma referência calculada, não promessa de resultado.

## Supabase e identidade

O projeto Supabase aberto anteriormente é o de produção. Não foi executada migração nem gravação nesta etapa. O repositório não tem migrações existentes para treino; a nova migração é aditiva e isolada. Supabase CLI, Docker e `psql` não estão instalados, por isso a validação disponível foi estática e por testes de contrato, não uma execução real de PostgreSQL.

A RPC `hag_run_save` é `SECURITY INVOKER`, usa RLS e grava as três entidades numa transação. A página somente habilita essa integração se o host definir `window.HAG_RUN_CONFIG` com `url`, `anonKey` publicável e `getAccessToken()` que retorne um JWT de usuário autenticado. Nunca configure chave `service_role` no navegador.

O fluxo existente do HAG Treino também usa links pessoais sem usuário Supabase autenticado. Esses links não têm um `auth.uid()` compatível com as novas políticas. A integração da página com esse fluxo depende de uma decisão de identidade/autorização própria; não se deve contornar RLS nem usar credenciais de serviço. Por isso, no clone atual, o salvamento está desativado e os registros da sessão ficam apenas em memória.

## Executar localmente

No diretório `HAG_RUN_dev`, rode:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/hag_run_HAG.html`. Use um perfil fictício. Sem `HAG_RUN_CONFIG`, nenhum dado é enviado ou persistido. Para usar a migração, copie-a para o ambiente Supabase de desenvolvimento e valide a identidade autenticada, RLS e a RPC nesse ambiente antes de qualquer conexão da interface.

## Verificações executadas

```sh
node --check hag_run_engine.js
node --check hag_run_store.js
node --test tests/*.test.js
```

A suíte tem 36 testes unitários e de contrato. Inclui perfis R0 a R5, resultados recentes, dias de recuperação, duração exata das sessões, pace/esteira, progressão, sessão incompleta, baixa recuperação, dor, sintomas, token JWT e separação de dados na RPC. A migração foi inspecionada por testes de estrutura e políticas. A interface teve o HTML analisado e o JavaScript embutido passou em `node --check`; uma verificação visual interativa e uma integração real ao PostgreSQL ainda não foram concluídas.

## Limites

- O motor e os critérios ainda exigem revisão clínica antes de uso com pacientes.
- O plano está na semana 1 e contém progressão até 12 semanas para R0/R1. Não há acompanhamento persistente nem carregamento do histórico após fechar a página.
- Sessões demonstradas e avaliação ficam no estado da página. Sem banco de desenvolvimento, não há teste de persistência real.
- O catálogo HAG existente e seus 42 programas permanecem intactos. A correção local para dor articular importante está apenas no clone, em `treino_HAG.html`.
- Produção e `main` não foram modificadas. Nenhuma migração, publicação ou alteração em dados reais foi feita.
