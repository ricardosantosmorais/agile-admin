# Batch: controllers

Commits: 5
Date range: 2026-03-26..2026-04-17

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-26 | 8df9be0ff | behavior-change | triage-needed | Admin usa PainelB2BApi no Editor SQL | 3 |
| 2026-03-29 | f4235fad3 | cache-or-assets | triage-needed | Simplifica renovacao de cache para API efetiva | 2 |
| 2026-03-31 | 2c4ee3ef4 | form-field-or-form-flow | triage-needed | Fix admin cache invalidation flows | 4 |
| 2026-04-02 | c5e30a6c7 | bugfix | triage-needed | fix: gate billing banner by cobranca_upgrade | 1 |
| 2026-04-17 | 929884d06 | cache-or-assets | triage-needed | Improve remote cache invalidation observability | 2 |

## Detailed commits

### 8df9be0ff - Admin usa PainelB2BApi no Editor SQL

- Date: 2026-03-26
- Type: behavior-change
- Disposition: triage-needed
- Files:
  - M boot.php
  - M controllers/editor-sql-controller.php
  - M controllers/editor-sql-tabed-controller.php

### f4235fad3 - Simplifica renovacao de cache para API efetiva

- Date: 2026-03-29
- Type: cache-or-assets
- Disposition: triage-needed
- Files:
  - M boot.php
  - M controllers/api-controller.php

### 2c4ee3ef4 - Fix admin cache invalidation flows

- Date: 2026-03-31
- Type: form-field-or-form-flow
- Disposition: triage-needed
- Files:
  - M controllers/api-controller.php
  - M controllers/areas-pagina-controller.php
  - M controllers/componentes-campos-controller.php
  - M controllers/componentes-controller.php

### c5e30a6c7 - fix: gate billing banner by cobranca_upgrade

- Date: 2026-04-02
- Type: bugfix
- Disposition: triage-needed
- Files:
  - M controllers/billing-upgrade-controller.php

### 929884d06 - Improve remote cache invalidation observability

- Date: 2026-04-17
- Type: cache-or-assets
- Disposition: triage-needed
- Files:
  - M controllers/api-controller.php
  - M includes/tenant-context.php
