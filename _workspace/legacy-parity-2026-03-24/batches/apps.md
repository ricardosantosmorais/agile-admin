# Batch: apps

Commits: 3
Date range: 2026-04-06..2026-04-28

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-04-06 | f08412579 | bugfix | triage-needed | fix: atualiza branch de publicacao dos apps para develop | 2 |
| 2026-04-10 | c28adc182 | bugfix | triage-needed | Remove admin app-level HTTPS redirect | 1 |
| 2026-04-28 | 017723209 | ui-flow-or-visual | triage-needed | fix: estabiliza modal de logs de apps | 2 |

## Detailed commits

### f08412579 - fix: atualiza branch de publicacao dos apps para develop

- Date: 2026-04-06
- Type: bugfix
- Disposition: triage-needed
- Files:
  - M controllers/apps-controller.php
  - M includes/github_helper.php

### c28adc182 - Remove admin app-level HTTPS redirect

- Date: 2026-04-10
- Type: bugfix
- Disposition: triage-needed
- Files:
  - M boot.php

### 017723209 - fix: estabiliza modal de logs de apps

- Date: 2026-04-28
- Type: ui-flow-or-visual
- Disposition: triage-needed
- Files:
  - M assets/js/components/apps-list.js
  - M controllers/apps-controller.php

## V2 check result

- Checked against the current v2 Apps module after `master` merge.
- No production migration needed.
- `f08412579`: already covered by `app/api/apps/_apps-github.ts`, where the GitHub branch falls back to `develop`.
- `c28adc182`: not applicable; v2 does not use legacy PHP `boot.php` app-level HTTPS redirect.
- `017723209`: already covered by React state/list architecture. `AppsLogsModal` is controlled by `AppsListPage` state, and `APPS_CONFIG` already separates `nome_app` and `identificador_app` sort/filter keys in the corrected legacy order.
