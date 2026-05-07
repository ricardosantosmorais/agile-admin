# Batch: includes

Commits: 1
Date range: 2026-04-10..2026-04-10

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-04-10 | 5003de21a | behavior-change | migrated | Traduz regras amigaveis de rastreabilidade | 1 |

## Detailed commits

### 5003de21a - Traduz regras amigaveis de rastreabilidade

- Date: 2026-04-10
- Type: behavior-change
- Disposition: migrated
- Files:
  - M includes/helpers.php

## V2 decision

- Migrated to `Pedidos` detail because the legacy helper feeds the product `origin_trace` technical modal.
- The v2 now builds friendly trace rows from the product metadata catalog and keeps the raw JSON below for audit.
- Covered by `src/features/pedidos/services/pedidos-mappers.test.ts`.
