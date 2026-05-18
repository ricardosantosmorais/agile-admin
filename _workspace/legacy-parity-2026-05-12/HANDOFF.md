# Legacy parity 2026-05-12 - handoff

Atualizado em: 2026-05-18

## Objetivo

Este arquivo é o ponto de entrada para continuar a migração legado -> v2 em chats separados.

Use este handoff junto com:

- `status.md`
- `batches/index.md`
- o arquivo do batch em `batches/*.md`
- evidências em `evidence/*.md`, quando existirem
- legado em `C:\Projetos\admin`
- v2 em `C:\Projetos\admin-v2-web`

## Estado atual do repositório

- Branch de trabalho: `codex/legacy-parity-2026-05-12`
- Branch remota da fase: `origin/codex/legacy-parity-2026-05-12`
- A branch tem histórico de migração já publicado no remoto da própria branch.
- `origin/master` avançou depois com documentação de design.
- Antes de enviar esta branch para `master`, rebase/merge contra `origin/master` e validar conflitos de documentação/design.

## Regra antes de limpar a branch

Não resetar ou descartar a branch antes de preservar:

- `_workspace/legacy-parity-2026-05-12/status.md`
- `_workspace/legacy-parity-2026-05-12/HANDOFF.md`
- `_workspace/legacy-parity-2026-05-12/batches/*.md`
- `_workspace/legacy-parity-2026-05-12/evidence/*.md`
- documentos de módulo em `docs/*.md` alterados nesta fase
- testes e implementações ligados aos batches concluídos

Se for necessário recomeçar de `master`, primeiro criar um commit/checkpoint com a documentação de migração ou exportar estes arquivos para uma branch segura.

## Como abrir novos chats

Para cada novo chat, comece com:

1. Abrir em `C:\Projetos\admin-v2-web`.
2. Ler `AGENTS.md`, `docs/README.md`, `docs/adr/README.md` e `docs/12-catalogo-componentes-compartilhados.md`.
3. Ler este `HANDOFF.md`.
4. Ler o batch específico em `batches/*.md`.
5. Conferir o legado em `C:\Projetos\admin` antes de implementar.
6. Trabalhar em uma branch limpa a partir de `master` quando a frente for nova.
7. Ao fechar a frente, atualizar o batch, `status.md` e o documento de módulo em `docs/`.

## Status consolidado dos batches

| Ordem | Batch | Estado | Próximo uso |
|---:|---|---|---|
| 1 | `catalogos-digitais` | Parcialmente migrado | Continuar studio: blocos, produtos/coleções, precificação, preview/PDF/publicação e validação visual final. |
| 2 | `agile-store-ajustes` | Concluído | Usar apenas como referência; manter evidência de feedback/material/poster. |
| 3 | `pedidos-logistica` | Concluído | Usar como referência para cancelamento, filial de entrega e status IBoltt. |
| 4 | `formularios-arquivos` | Concluído | Usar como referência para links de arquivos tenant-aware e exibição em cliente/contato. |
| 5 | `configuracoes-admin` | Concluído | Usar como referência para JSON formatado, rich text e serviços ERP/script. |
| 6 | `infraestrutura-aws` | Parcial, dependente de backend | Não marcar como migrado até `api-v3` expor endpoints equivalentes. |
| 7 | `shell-docs-operacao` | Concluído | Usar como referência para sessão 8h, boot/applicability e docs. |
| 8 | `status-plataforma` | Concluído | Usar como referência para topbar/status tenant via `api-v3`. |
| 9 | `relatorios-data-hora` | Concluído | Usar como referência para filtros `data_hora` em relatórios dinâmicos. |
| 10 | `pedidos-brinde-aprovacao` | Concluído | Usar como referência para aprovação cascata de pedidos brinde. |
| 11 | `vendedores-valida-horario` | Concluído | Usar como referência para flag operacional simples em CRUD existente. |

## Pendências principais

### Catálogos Digitais

Ainda precisa de uma frente dedicada para fechar a paridade visual/funcional com o legado.

Pontos pendentes registrados:

- studio de blocos completo;
- importação/busca de produtos e coleções;
- precificação com contexto comercial;
- preview;
- PDF/publicação conforme contrato disponível;
- validação visual em light/dark e responsivo;
- confirmar se o backend atual já cobre todos os contratos usados pelo legado.

Arquivo de referência: `batches/catalogos-digitais.md`.

### Infraestrutura AWS

As superfícies v2 e mappers foram preparados, mas a coleta funcional não deve morar no frontend.

Pendência real:

- `api-v3` precisa expor endpoints equivalentes aos controladores legados.
- Até lá, `Saúde da Plataforma` e `Financeiro AWS` ficam como parcialmente migrados.

Arquivo de referência: `batches/infraestrutura-aws.md`.

## Artefatos locais que não devem entrar em master sem revisão

Prováveis descartáveis:

- `.playwright-mcp/`
- `login-snapshot.md`
- `status-platform-snapshot.md`

Arquivos de design/documentação novos devem ser reconciliados com `origin/master`, porque `master` já recebeu um commit de design:

- `DESIGN.md`
- `docs/design-system-tecnico.md`

## Ordem recomendada daqui em diante

1. Consolidar/validar esta documentação de handoff.
2. Reconciliar a branch com `origin/master`.
3. Decidir se a branch atual será enviada inteira para `master` depois de validação, ou usada apenas como checkpoint para abrir novas branches limpas por batch.
4. Abrir o próximo chat para `catalogos-digitais`, porque ainda é a maior pendência funcional.
5. Manter `infraestrutura-aws` separado, pois depende de backend.

## Comandos úteis

```powershell
git -c safe.directory=C:/Projetos/admin-v2-web status --short --branch
git -c safe.directory=C:/Projetos/admin-v2-web rev-list --left-right --count HEAD...origin/master
git -c safe.directory=C:/Projetos/admin-v2-web diff --name-only HEAD --
.\npxw.cmd vitest run <testes-da-frente>
.\npxw.cmd eslint <arquivos-da-frente>
```
