# Instruções para agentes de desenvolvimento

- Use Issues e Pull Requests do GitHub como registro compartilhado de requisitos, decisões, testes e revisões. Leia `docs/DEVELOPMENT_WORKFLOW.md` antes de iniciar uma tarefa.
- Este repositório é público. Não inclua dados reais de pacientes, credenciais, tokens, URLs pessoais nem relatórios que os revelem. Use somente dados sintéticos.
- Não conecte nem escreva no Supabase de produção. Nunca use uma chave privilegiada do Supabase no navegador ou no CI. Não execute migrações automaticamente; valide mudanças de banco em ambiente isolado.
- Preserve o funcionamento existente do HAG OS e faça mudanças pequenas, verificáveis e compatíveis.
- Antes de concluir, rode `npm run verify` e registre resultados, riscos e pendências no PR.
- Não faça merge, publicação, deploy ou alteração destrutiva sem aprovação humana explícita. Não habilite auto-merge.
- Não configure agentes com credenciais persistentes, workflows com permissão de escrita ou serviços pagos sem autorização específica.
- Limite correções automatizadas. Este repositório não permite loops de auto-fix; apresente falhas para análise e correção em uma nova alteração revisável.
