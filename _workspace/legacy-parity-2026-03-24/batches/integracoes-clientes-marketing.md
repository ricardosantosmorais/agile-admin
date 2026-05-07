# Batch: integracoes/clientes-marketing

Commits: 1
Date range: 2026-04-09..2026-04-09

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-04-09 | 40aa4d4c2 | ui-flow-or-visual | migrated | feat: ajusta integracao de clientes | 4 |

## Detailed commits

### 40aa4d4c2 - feat: ajusta integracao de clientes

- Date: 2026-04-09
- Type: ui-flow-or-visual
- Disposition: migrated
- Files:
  - M assets/sass/dark-theme.css
  - M components/integracao-cliente-form.php
  - M components/integracao-marketing-form.php
  - M controllers/integracao-cliente-controller.php

## V2 decision

- Migrated CFO support to `Integrações > Clientes` with a protected `cro_apikey` secret field and tenant-parameter payload parity.
- Preserved the legacy CFO instruction text in the v2 tab using the current `SectionCard`/secret-input patterns.
- The RD Station E-Commerce instruction block already existed in v2; its helper text was aligned to semantic theme tokens for dark-mode contrast.
- Covered by mapper unit coverage and the existing `Integrações > Clientes` E2E spec.
