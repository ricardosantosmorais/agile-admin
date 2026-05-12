# Legacy parity run status

Run: legacy-parity-2026-05-12
Legacy repo: C:/Projetos/admin
V2 repo: C:/Projetos/admin-v2-web
Legacy range: 99f6b7ee9..2d57cb13c
Legacy base: 99f6b7ee9
Legacy target: 2d57cb13c
Created at: 2026-05-12

## Objective

Open a new parity phase for legacy changes merged after the previous run.
The previous run `legacy-parity-2026-03-24` remains the historical reference for completed/deferred items.

This phase should not continue blindly from the old queue. It starts from the new legacy delta and groups commits by product surface so each stage can be analyzed, migrated or explicitly recorded.

## Current state

- `master` in v2 includes the Agile Store visual/detail fix and the Apps parity record.
- The new legacy delta contains 66 commits, including merge commits.
- The dominant new surface is `Catálogos Digitais`.
- The legacy repo had a local dirty `boot.php` when this inventory was created; it was not modified by this run.

## Recommended execution order

1. `catalogos-digitais`
2. `agile-store-ajustes`
3. `pedidos-logistica`
4. `formularios-arquivos`
5. `configuracoes-admin`
6. `infraestrutura-aws`
7. `shell-docs-operacao`

## Batch summary

| Order | Batch | Main point | Initial disposition |
|---:|---|---|---|
| 1 | `catalogos-digitais` | New digital catalog studio, permissions, publication, PDF generation, recalculation and tenant upload behavior. | analyze-first |
| 2 | `agile-store-ajustes` | Materials, posters, benefits and feedback/status UX for Agile Store. | analyze-after-current-ui |
| 3 | `pedidos-logistica` | Order cancellation by API v2, delivery branch reference and Ibolt status/menu behavior. | analyze-contracts |
| 4 | `formularios-arquivos` | File preview in form submissions and contact/info display fixes. | compare-existing-v2 |
| 5 | `configuracoes-admin` | JSON formatting in parameters, seller/customer/config masks, root/admin fixes and SQL/services fixes. | split-by-owner |
| 6 | `infraestrutura-aws` | New AWS infrastructure dashboards and EB/RDS/WAF operational helpers. | likely-new-surface |
| 7 | `shell-docs-operacao` | Session duration, route scroll reset, boot/docs/deploy operational adjustments. | mostly-applicability-check |

## Next step

Start with `catalogos-digitais` because it is the largest and most product-relevant new surface. Before implementing, compare:

- legacy components/controllers/scripts for catalog studio;
- existing v2 menu/features/routes for catalog/product/catalog admin;
- API/backend contracts currently available to v2.

