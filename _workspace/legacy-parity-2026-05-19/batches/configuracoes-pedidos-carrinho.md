# Batch: configuracoes-pedidos-carrinho

Title: Configuracoes > Pedidos: ordenacao do carrinho
Disposition: migrado-v2
Priority: P1
Commit count: 2

## Summary

Adicionar o parametro legado `ordem_carrinho` em Configuracoes > Pedidos com default `nome_az` e opcoes `nome_az`, `insercao`, `quantidade`.

## Current reading

- Recommendation: Concluida nesta rodada.
- Rationale: Campo simples em tela ja existente no v2, baixo acoplamento, sem depender de backend novo.
- V2 evidence before implementation: `src/features/configuracoes-pedidos/types/configuracoes-pedidos.ts` did not include `ordem_carrinho` in `ConfiguracoesPedidosFieldKey`.
- V2 evidence after implementation: `ordem_carrinho` is included in the field key, mapper definition, default form state, i18n dictionaries and module docs.
- Legacy evidence: commits `6de8adb15` and `bea05a713` add the field and final labels.
- Completed v2 work: field key, mapper definition, i18n PT/EN, docs `40-modulo-configuracoes-pedidos-precos-produtos-vendedores.md`, focused mapper test.

## Implementation notes - 2026-05-19

- Compared legacy commits:
  - `6de8adb15`: added `ordem_carrinho` in `components/configuracoes-pedidos-form.php` with default `nome_az`.
  - `bea05a713`: adjusted final labels to `Data de Inclusão` and `Quantidade (Maior-Menor)`.
- Implemented in v2:
  - added `ordem_carrinho` to `ConfiguracoesPedidosFieldKey`;
  - added enum definition in `configuracoes-pedidos-mappers` with default `nome_az`;
  - preserved options `nome_az`, `insercao`, `quantidade` and helper `Define a ordem de exibição dos produtos no carrinho`;
  - updated PT/EN i18n dictionaries;
  - updated module docs in `docs/40-modulo-configuracoes-pedidos-precos-produtos-vendedores.md`;
  - added focused mapper/configuration coverage in `src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers.test.ts`.
- Validation:
  - `.\npxw.cmd vitest run src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers.test.ts --configLoader native` -> passed, 4 tests.
- Scope guardrails:
  - no legacy file changed;
  - no `boot.php` change;
  - no `api-v3` change;
  - Catalogos Digitais PDF/publication remains pending and outside this slice.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-12 | `6de8adb15` | Adiciona configuracao de ordenacao do carrinho | migrado-v2 | 1 |
| 2026-05-12 | `bea05a713` | Ajusta labels da ordenacao do carrinho | migrado-v2 | 1 |

## Legacy files touched

- `components/configuracoes-pedidos-form.php`
