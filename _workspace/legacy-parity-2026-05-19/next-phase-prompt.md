# Prompt da Proxima Fase - Legacy Parity

Use este prompt para abrir a proxima fase a partir da `master` publicada do `admin-v2-web`.

```text
Estamos no repo C:\Projetos\admin-v2-web.

Contexto:
- A rodada anterior publicou na master as fatias:
  - `configuracoes-parametros-filial-autocomplete`
  - `notificacoes-painel-email-cdn`
- Antes de iniciar nova fatia, verificar `git status --short --branch`.
- Se a master estiver limpa e sincronizada, criar branch nova com prefixo `codex/`.
- Nao tocar em C:\Projetos\admin.
- Nao tocar em api-v3 sem aprovacao explicita.
- Para ler legado, usar apenas comandos read-only contra C:\Projetos\admin e origin/master, sem pull/merge no worktree local.

Antes de implementar:
1. Ler AGENTS.md.
2. Ler docs/README.md, docs/adr/README.md e docs/12-catalogo-componentes-compartilhados.md.
3. Ler:
   - _workspace/legacy-parity-2026-05-19/status.md
   - _workspace/legacy-parity-2026-05-19/backlog.md
   - _workspace/legacy-parity-2026-05-19/batches/index.md
   - _workspace/legacy-parity-2026-05-19/upcoming-roadmap.md
4. Verificar git status --short --branch.
5. Conferir que Parâmetros e Notificações já estão na master; não reabrir essas fatias.

Tarefa da próxima fatia:
Validar e, se necessário, migrar a fatia v2-owned `servicos-integracao-inativos-detalhes`.

Evidência:
- Legado commit b197672eb: "Adicao do botao de detalhes para servicos inativos".
- O roadmap indica que o v2 já possui superfície de serviços ERP em `app/api/integracao-com-erp/servicos/route.ts`.
- O endpoint v2 já reconhece `scope=inactive` e pode já ter ações/detalhes de serviço.
- A tarefa não é duplicar UI: primeiro confirmar se a listagem/modal de inativos já expõe detalhes equivalentes ao legado.

Escopo permitido:
- Alterar apenas admin-v2-web.
- Ajustar somente a superfície v2 de serviços de integração/ERP, se a lacuna for comprovada.
- Adicionar ou ajustar testes focados.
- Atualizar docs se o comportamento da tela mudar.

Escopo proibido:
- Não alterar C:\Projetos\admin.
- Não alterar api-v3.
- Não iniciar Cashback.
- Não iniciar infraestrutura AWS.
- Não refatorar todo o módulo de integração ERP sem necessidade.
- Não duplicar tela/ação se o fluxo já existir no v2.

Resultado esperado:
- Diagnóstico claro: já migrado no v2 ou lacuna real.
- Se houver lacuna, serviços inativos devem ter acesso aos detalhes equivalentes ao legado.
- Se já estiver coberto, registrar a evidência e não alterar código.
- Deve haver cobertura focada quando houver mudança de comportamento.

Validação mínima:
- Se houver código alterado, rodar teste focado novo/alterado.
- Rodar git diff --check.
- Se houver alteração textual/i18n/docs, conferir acentos/encoding nos arquivos tocados.
- Registrar no fechamento se validação visual ficou pendente por ambiente/sessão/dados.
```
