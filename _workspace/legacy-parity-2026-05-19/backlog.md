# Legacy parity backlog - 2026-05-19

Range: `2d57cb13c..6cb70a741`
Total commits analyzed: 94

## Priority order

| Priority | Batch | State | Commits | Why | Next action |
|---|---|---|---:|---|---|
| P1 | [configuracoes-pedidos-carrinho](./batches/configuracoes-pedidos-carrinho.md) | migrado-v2 | 2 | Campo simples em tela ja existente no v2, baixo acoplamento, sem depender de backend novo. | Concluida nesta rodada |
| P1 | [produtos-embalagens-edicao](./batches/produtos-embalagens-edicao.md) | migrado-v2 | 2 | Ha superficie v2 existente, mas o ajuste legado protege a edicao de embalagens quando o identificador vem composto. | Concluida nesta rodada |
| P2 | [infraestrutura-aws](./batches/infraestrutura-aws.md) | depende-backend-contrato | 25 | A superficie v2 foi preparada na fase anterior, mas execucao real exige endpoints server-side fora do front. | Nao iniciar no frontend agora |
| P3 | [status-plataforma-shell](./batches/status-plataforma-shell.md) | ja-migrado | 52 | Handoff anterior registra a migracao no topbar, rota `/status-plataforma` e bridge `/api/shell/platform-status`. | Sem nova fatia |
| P3 | [relatorios-data-hora](./batches/relatorios-data-hora.md) | ja-migrado | 2 | Handoff anterior registra mapper, bridge e UI com `__start`/`__end`. | Sem nova fatia |
| P3 | [pedidos-brinde-aprovacao](./batches/pedidos-brinde-aprovacao.md) | ja-migrado | 2 | Handoff anterior registra aprovacao cascata e parametro `internaliza_brinde`. | Sem nova fatia |
| P3 | [vendedores-valida-horario](./batches/vendedores-valida-horario.md) | ja-migrado | 1 | Handoff anterior registra form state, detail mapping e payload. | Sem nova fatia |
| P3 | [agile-store-tema](./batches/agile-store-tema.md) | ja-migrado | 2 | Fatia anterior publicou ajustes visuais/detail/feedback/material/poster. | Sem nova fatia |
| P4 | [asset-version-refresh-legado](./batches/asset-version-refresh-legado.md) | nao-aplicavel-v2 | 5 | O v2 nao usa `boot.php`, `ASSETS_VERSION` nem o refresh legado removido. | Nao migrar |
| P4 | [docs-ai-first-legado](./batches/docs-ai-first-legado.md) | nao-aplicavel-v2 | 1 | Atualizacao documental do repo legado, sem superficie de produto no v2. | Nao migrar |

## Suggested next slices

1. `configuracoes-pedidos-carrinho`: concluida no v2 com `ordem_carrinho`, default `nome_az`, i18n, docs e teste focado.
2. `produtos-embalagens-edicao`: concluida no v2 com normalizacao do ID real de `produtos_embalagens` para salvar/remover embalagens.
3. Keep `infraestrutura-aws` deferred; do not touch api-v3 in this phase.
4. If an AWS capability is only implemented directly in legacy PHP, document it as legacy-only/deferred and skip it for now.
5. Do not start another slice until this diff is reviewed/closed.

## Not blocking this phase

- `catalogos-digitais`: partial. Keep PDF/publication/final validation pending and documented, but do not return to it in this first new batch.
- `asset-version-refresh-legado`: legacy-only `boot.php`/asset-version behavior.
- `docs-ai-first-legado`: documentation-only in the legacy repo.
