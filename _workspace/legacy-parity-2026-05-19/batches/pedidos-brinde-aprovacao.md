# Batch: pedidos-brinde-aprovacao

Title: Pedidos: aprovacao em cascata de brinde
Disposition: ja-migrado
Priority: P3
Commit count: 2

## Summary

Aprovacao manual do pedido principal aprova pedidos de brinde pendentes da mesma transacao.

## Current reading

- Recommendation: Sem nova fatia.
- Rationale: Handoff anterior registra aprovacao cascata e parametro `internaliza_brinde`.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-15 | `1e69cf3b4` | Inclusão de Lógica para mudança de status ao aprovar pedidos com brinde | ja-migrado | 1 |
| 2026-05-15 | `e1f66b559` | Merge pull request #739 from agileecommerce/fix/aprovacao-pedidos-brinde | ja-migrado | 0 |

## Legacy files touched

- `controllers/pedidos-controller.php`
