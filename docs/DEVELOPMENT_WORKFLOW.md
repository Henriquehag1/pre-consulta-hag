# Fluxo de desenvolvimento HAG OS

## Fonte de trabalho

Este repositório GitHub é a fonte de código e o registro compartilhado das tarefas, decisões, alterações, resultados e revisões. Abra Issues para requisitos e falhas. Relacione cada Pull Request a uma Issue. Não use este repositório público para dados clínicos, credenciais, tokens ou exemplos identificáveis.

## Etapas

1. **Planejamento:** abra uma Issue com objetivo, escopo, critérios de aceite, riscos clínicos e requisitos de dados. Codex pode receber o número da Issue e trabalhar diretamente no clone conectado ao GitHub, sem transcrição manual da descrição.
2. **Implementação:** faça alterações somente em branch de desenvolvimento. Preserve compatibilidade, registre decisões em Markdown e nunca inclua dados reais.
3. **Testes:** rode `npm test` e `npm run check`. O workflow `HAG RUN CI` executa os mesmos comandos ao enviar branch `codex/**`, ao abrir ou atualizar PR para `main`, ou manualmente pela aba Actions.
4. **Revisão:** examine o resumo e os logs do workflow no GitHub. Codex Desktop pode revisar o diff quando solicitado no ambiente conectado. Registre achados e correções no PR. Revisão de modelo é auxiliar, não aprova segurança, conduta clínica ou publicação.
5. **Correção:** corrija achados na mesma branch, com número limitado de rodadas definido na Issue ou pelo responsável. Cada push executa uma nova validação. Não há agente de correção automática nem loop de tentativas.
6. **Validação:** uma pessoa confirma critérios, revisão, impacto clínico, migrações e autorização de publicação. Merge, publicação e mudanças em produção permanecem manuais.

## O que o CI executa

- Node.js 22, sem instalar dependências externas.
- Testes unitários e contratos locais em `tests/`.
- Sintaxe dos módulos e script inline de `hag_run_HAG.html`.
- Integridade das referências de scripts locais, ausência de handlers HTML inline e detecção básica de padrões de segredo no HTML do HAG RUN.
- Um resumo por execução em `Actions → HAG RUN CI → Summary`, além de resultados e logs dos passos.

O workflow tem `contents: read`, não acessa secrets, não envia comentários, não publica artefatos, não acessa Supabase e não aplica migrações. Os testes de migração atuais são estáticos; integração real com PostgreSQL requer ambiente fictício isolado e autorização própria.

## Agentes e limites

- **Codex:** disponível nesta instalação, autenticado no ChatGPT e com o repositório aberto por integração GitHub e clone local. Usa Issues/PRs como contexto persistente. Uma sessão Codex local ou do Desktop depende do app ou CLI estar em execução.
- **Claude Code:** CLI local instalado e autenticado pela assinatura Claude Max. Não há integração de Claude Code habilitada no GitHub Actions. A revisão automática exigiria instalar o Claude GitHub App, conceder permissões de escrita em conteúdo/issues/PRs e guardar `CLAUDE_CODE_OAUTH_TOKEN` como secret do repositório. O OAuth pode usar a assinatura, sem cobrança API por token, mas consome a franquia Max. Essa autorização adicional não foi concedida; por isso a revisão Claude permanece manual no ambiente local.
- **GitHub Actions:** roda testes sem conversa aberta, em runners externos do GitHub. Não executa agente de IA.

Não configure segredos ou runners auto-hospedados para estes agentes sem aprovação. Não use a ação `pull_request_target` para executar código vindo de PR. Não habilite auto-merge. O CI e a revisão nunca autorizam publicação.

## Revisão do repositório e branch principal

A branch `main` está protegida: exige Pull Request e o status `Testes e integridade`, bloqueia force push e exclusão e aplica a regra também aos administradores. O auto-merge do repositório está desativado. Há somente um colaborador com escrita, então a proteção não exige aprovação de uma segunda pessoa que não existe; a publicação requer que o proprietário promova o PR de draft, revise e clique manualmente em Merge. O merge de `main` pode disparar a publicação existente do GitHub Pages.

O Codex automático por `@codex review` não foi habilitado no repositório. O Codex Desktop/CLI pode trabalhar no clone e no PR conectado. Ativar revisão automática de Codex exige a integração do produto e usa a franquia de Code Review da conta.

## Custos e continuidade

O workflow usa runners padrão em um repositório público, sem artifacts, cache ou serviços pagos. As regras de cobrança do GitHub podem mudar; confirme a página Billing antes de adicionar runners maiores, artefatos, armazenamento ou serviços. Revisões por IA usam a franquia/assinatura do produto e não são chamadas pelo CI.

Workflows GitHub Actions continuam após fechar o Codex, pois são executados pelo GitHub. Tarefas Codex Desktop/CLI e Claude Code local só continuam enquanto o serviço/sessão correspondente estiver ativo. Uma automação agendada pelo Codex App seria um serviço separado, com permissões e custos próprios, e não foi criada.
