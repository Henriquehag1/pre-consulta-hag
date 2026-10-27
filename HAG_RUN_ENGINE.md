# HAG RUN, desenvolvimento

Implementação inicial independente para Rumo aos 5 km. A interface está em `hag_run_HAG.html`, o motor puro em `hag_run_engine.js`, a persistência opcional em `hag_run_store.js` e a migração aditiva em `supabase/migrations/202610270001_hag_run.sql`.

## O que está pronto

- Avaliação com capacidade contínua, frequência, volume semanal, maior corrida, dias livres, pace conhecido, modalidade, dor e alertas de lesão ou sintomas.
- Resultado recente opcional para individualizar o nível avançado R5 e calcular uma referência de pace. A página aceita testes de 3 a 10 km.
- Classificação funcional R0 a R5 e prescrição da semana 1 em sessões segmentadas, com aquecimento, corrida, caminhada e volta à calma.
- Timer de intervalos, pausa, retomada, pulo de etapa e encerramento. Pular etapas deixa a execução como incompleta. A contagem usa `performance.now()`, preserva pausas e limita cada etapa à duração prescrita.
- Registro separado da execução real: conclusão, duração, distância, RPE, dificuldade, dor, fadiga, recuperação, sintomas e nova lesão.
- Progresso condicionado a sessões concluídas e bem toleradas. Dor, sintomas, fadiga alta ou recuperação insuficiente bloqueiam ou seguram o avanço.
- Temporizador por segmento com pausa, retomada, encerramento e registro da execução realmente realizada.
- Adaptador Supabase por link pessoal, enviando o token apenas no corpo das RPCs. Não usa `patient_id` do navegador nem chave `service_role`.
- Histórico do programa, avaliação, perfil funcional, snapshots imutáveis de prescrição, execução, sintomas e recomendação de progressão.
- Recuperação do plano vigente, semana e até 200 sessões anteriores quando a pessoa reabre o aplicativo.
- Migração aditiva com RLS habilitada e forçada, acesso às tabelas negado e wrappers públicos `SECURITY INVOKER` delegando a funções internas que validam o token.

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

A arquitetura detalhada está em [HAG_RUN_DECISION.md](HAG_RUN_DECISION.md). O paciente continua sem conta, como no link existente `treino_HAG.html?t=<token>`. O banco confirma token, revogação e expiração opcional, e deriva `patient_id`. Nenhuma migração ou escrita foi feita no projeto de produção.

A integração requer que o host defina `window.HAG_RUN_CONFIG` com `url` e `anonKey` publicável de um projeto isolado que tenha a migração aplicada. Sem essa configuração, o aplicativo oferece apenas demonstração local. Nunca configure chave `service_role` no navegador. O schema `hag_run_private` deve ficar fora das schemas expostas pela Data API.

## Executar localmente

No diretório `HAG_RUN_dev`, rode:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/hag_run_HAG.html`. Sem token pessoal e sem configuração Supabase, use um perfil fictício no modo demonstração.

## Testes

```sh
npm run verify
npm run test:postgres
npm run test:supabase
npm run test:ui
```

- `npm run verify` executa os testes determinísticos Node e a checagem de integridade. Os 48 testes não exigem banco.
- `npm run test:postgres` cria um cluster PostgreSQL 17 temporário, aplica fixtures sintéticas e a migração, executa testes SQL e duas gravações concorrentes. Requer `brew install postgresql@17` no macOS.
- `npm run test:supabase` prepara uma stack Supabase local e temporária, sem link a projeto remoto, testa a migração, Database Advisors e chamadas RPC reais via PostgREST, e destrói a stack no final. Requer Supabase CLI, Python 3 e PostgreSQL 17. Em Apple Silicon sem Docker, usa o runtime nativo experimental do CLI.
- `npm run test:ui` exerce o aplicativo em navegador Chromium com emulação mobile a 320 px, iPhone 13 e tablet a 768 px. Na primeira execução do browser, use `npx playwright install chromium`. É emulação, não aparelho físico.

Os testes de banco usam somente dois pacientes sintéticos. Não verificam a configuração ou o schema do projeto remoto de produção.

## Limites

- O motor e os critérios ainda exigem aprovação clínica antes de uso com pacientes. R0 e R1 ainda usam o mesmo protocolo inicial; veja [relatório de homologação](docs/HAG_RUN_HOMOLOGACAO.md).
- O motor atual gera planos na página; validação clínica formal ainda é necessária antes de uso assistencial.
- A aplicação guarda a sessão em andamento somente em memória; a execução começa a ser persistida quando a pessoa envia o registro ao fim ou interrompe a sessão.
- O identificador idempotente pendente sobrevive à recarga da mesma aba; a sessão cronometrada e seus campos ainda não são persistidos antes do envio do formulário.
- A tela ainda não está conectada ao host HAG Treino, que deve fornecer a URL e a chave publicável do ambiente de desenvolvimento.
- O catálogo HAG existente e seus 42 programas permanecem intactos. A correção local para dor articular importante está apenas no clone, em `treino_HAG.html`.
- Produção e `main` não foram modificadas. Nenhuma migração, publicação ou alteração em dados reais foi feita.
