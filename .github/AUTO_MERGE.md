# Publicação automática (HAG_AUTO_MERGE_v1, 31/10/2026)

Os pedidos de publicação (pull requests) abertos pelo Claude entram no ar sozinhos, sem precisar de merge manual, quando:

1. a branch começa com `claude/`;
2. o PR foi aberto a partir deste repositório, pela conta dona (fork nunca entra);
3. o teste obrigatório **Testes e integridade** (`.github/workflows/hag-os-ci.yml`) termina com sucesso, no mesmo commit que vai para o `main`.

Quem faz o merge é o workflow `.github/workflows/hag-auto-merge.yml`. Ele não baixa nem roda o código do PR: só chama a API do GitHub. Depois do merge, pede a publicação do GitHub Pages.

**Autorização:** dada pelo Dr. Henrique em 31/10/2026.

**Para desligar:** apagar `hag-auto-merge.yml`, ou desativar o workflow "HAG auto-merge" na aba Actions do repositório.

**Para voltar uma página:** reverter o merge do PR no GitHub. A versão anterior volta a ser publicada.
