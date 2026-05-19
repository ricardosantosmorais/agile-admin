# Legacy parity run status

Run: legacy-parity-2026-05-19
Created at: 2026-05-19
V2 repo: C:/Projetos/admin-v2-web
Legacy repo: C:/Projetos/admin
Legacy range: 2d57cb13c..6cb70a741
Legacy target: 6cb70a741
V2 base branch: master
Working branch: codex/legacy-parity-2026-05-19
Last published v2 commit informed: dfbc47b - Migra fatia de catalogos digitais

## Guardrails applied

- `C:/Projetos/admin-v2-web` was checked on `master` clean before this branch was created.
- `C:/Projetos/admin` was read-only for this run.
- Legacy `boot.php` is locally modified and was not touched or reverted.
- Catalogos Digitais remains partially migrated; PDF/publication/final validation stay pending but do not block this inventory.

## Summary

- Total commits analyzed: 94
- Initial delta informed: 94 commits; confirmed by git rev-list --count 2d57cb13c..6cb70a741.
- Main concentration: status/platform shell and AWS operational dashboards.
- Practical migration candidates after Catalogos Digitais: `configuracoes-pedidos-carrinho` and `produtos-embalagens-edicao`; both frontend-owned slices are now completed in this branch.

## Counts by disposition

- depende-backend-contrato: 25
- ja-migrado: 59
- nao-aplicavel-v2: 6
- nao-migrado: 4

## Batches

| Order | Batch | Commits | Disposition | Priority | Recommendation |
|---:|---|---:|---|---|---|
| 1 | [configuracoes-pedidos-carrinho](./batches/configuracoes-pedidos-carrinho.md) | 2 | migrado-v2 | P1 | Concluida nesta rodada |
| 2 | [produtos-embalagens-edicao](./batches/produtos-embalagens-edicao.md) | 2 | migrado-v2 | P1 | Concluida nesta rodada |
| 3 | [infraestrutura-aws](./batches/infraestrutura-aws.md) | 25 | depende-backend-contrato | P2 | Nao iniciar no frontend agora |
| 4 | [status-plataforma-shell](./batches/status-plataforma-shell.md) | 52 | ja-migrado | P3 | Sem nova fatia |
| 5 | [relatorios-data-hora](./batches/relatorios-data-hora.md) | 2 | ja-migrado | P3 | Sem nova fatia |
| 6 | [pedidos-brinde-aprovacao](./batches/pedidos-brinde-aprovacao.md) | 2 | ja-migrado | P3 | Sem nova fatia |
| 7 | [vendedores-valida-horario](./batches/vendedores-valida-horario.md) | 1 | ja-migrado | P3 | Sem nova fatia |
| 8 | [agile-store-tema](./batches/agile-store-tema.md) | 2 | ja-migrado | P3 | Sem nova fatia |
| 9 | [asset-version-refresh-legado](./batches/asset-version-refresh-legado.md) | 5 | nao-aplicavel-v2 | P4 | Nao migrar |
| 10 | [docs-ai-first-legado](./batches/docs-ai-first-legado.md) | 1 | nao-aplicavel-v2 | P4 | Nao migrar |

## Recommendation

First migration slice completed: `configuracoes-pedidos-carrinho`.

Why:
- It is a small parameter addition in an existing v2 configuration module.
- It does not require new backend endpoints if the existing config bridge saves arbitrary/registered parameter keys through the same pattern.
- It is lower-risk than reopening AWS or status shell flows.

Second small slice completed: `produtos-embalagens-edicao`. The v2 bridge now normalizes the real `produtos_embalagens.id` before save/delete even when the row id arrives encoded by the v2 (`id|produto|filial`) or composed with the legacy product/branch suffix.

Do not start now:
- Catalogos Digitais PDF/publication, by explicit instruction.
- Infraestrutura AWS functional collection, until backend/API contract exists.

## Real blockers and pending dependencies

- `infraestrutura-aws`: depends on backend/server-side contract for AWS credentials, assume-role, logs, metric series and WAF writes. Current v2 surfaces should remain partial.
- Recheck 2026-05-19: api-v3 already has the financial AWS collector (`AwsFinancialLiveSnapshot`), but it is not exposed by HTTP route/controller; the AWS health/WAF/EB-log contract was not found. Decision: do not touch api-v3 now; if a capability only exists in direct legacy PHP, keep it deferred and skip to the next v2-owned batch. See `evidence/api-v3-infraestrutura-aws.md`.
- `catalogos-digitais`: partial, with PDF/publication and final functional/visual validation still open.
- `produtos-embalagens-edicao`: migrado no v2 com normalizacao focada em `src/features/produtos/services/produto-relations.ts` e uso na bridge `app/api/produtos/[id]/embalagens/route.ts`.
- `configuracoes-pedidos-carrinho`: migrado no v2 com a chave `ordem_carrinho`, default `nome_az`, opcoes legadas, i18n PT/EN, documentacao do modulo e teste focado do mapper.
- `produtos-embalagens-edicao`: migrado no v2 com preservacao do ID real de `produtos_embalagens` em salvamento e remocao; cobre ID codificado do v2 e sufixo legado `id_produto + id_filial`.

## Completed in this slice

- `configuracoes-pedidos-carrinho`: comparados os commits legados `6de8adb15` e `bea05a713`; o v2 agora preserva o contrato `ordem_carrinho` em Configuracoes > Pedidos.
- Validacao focada executada: `.\npxw.cmd vitest run src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers.test.ts --configLoader native` (4 testes passando).
- Escopo mantido no frontend v2; sem alteracoes em `C:/Projetos/admin`, `boot.php` ou `api-v3`.
- `produtos-embalagens-edicao`: comparados os commits legados `3110ae638` e `fbf435419`; o v2 agora decodifica/normaliza o identificador da embalagem antes de enviar `produtos_embalagens`.
- Validacao focada executada: `.\npxw.cmd vitest run src/features/produtos/services/produto-relations.test.ts --configLoader native` (3 testes passando).
- Validacao visual comparativa: nao executada nesta fatia por depender de ambiente/sessao/dados operacionais de Produtos; a cobertura automatizada ficou no contrato de ID que reproduz a causa do commit legado.

## Next step after infra recheck

Review the current diff before starting any new slice.

Do not start `infraestrutura-aws` in this round unless api-v3 work is explicitly approved later or a consumable backend HTTP contract is found already available.

## Artifacts

- `commits.csv`
- `commits.json`
- `backlog.md`
- `batches/index.md`
- `batches/*.md`
