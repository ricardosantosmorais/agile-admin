# Batch: pedidos-logistica

Initial priority: 3
Initial disposition: analyze-contracts

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-07 | abfc6d560 | Solicita cancelamento de pedidos pela API v2 |
| 2026-05-11 | 69e2cfe07 | Inclui referencia de filial na forma de entrega |
| 2026-05-11 | 7c23b470f | Remoção do status Pedido Recebido Ibolt |
| 2026-05-12 | 2d57cb13c | Merge pull request #734 from agileecommerce/fix/integracoes-logistica-ibolt |

## Main legacy files

- `assets/js/components/pedidos-list.js`
- `controllers/pedidos-controller.php`
- `components/formas-entrega-form.php`
- `controllers/formas-entrega-controller.php`
- `components/integracao-logistica-form.php`
- `scripts/php/formas-entrega-add-filial-referencia-entrega.php`

## Questions to answer before migration

- Does v2 order list/detail already expose cancellation request through API v2?
- Which route/contract in API v2 owns cancellation?
- Does `formas-entrega` in v2 already have branch reference fields or route support?
- Is the Ibolt status removal UI-only, mapper-only, or bridge-contract related?

## Initial recommendation

Analyze after Catálogos/Agile Store because it is operational but narrower. Validate both frontend surface and API route contracts before changing UI.

