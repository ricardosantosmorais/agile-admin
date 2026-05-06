# Batch: geral

Commits: 1
Date range: 2026-03-30..2026-03-30

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-30 | ddc50c41d | bugfix | already-covered-v2 | fix: support local admin on port 8080 | 1 |

## Detailed commits

### ddc50c41d - fix: support local admin on port 8080

- Date: 2026-03-30
- Type: bugfix
- Disposition: already-covered-v2
- V2 decision: already covered by architecture. The legacy fix adds `localhost:8080` and `127.0.0.1:8080` checks in `boot.php` to choose local API URLs, while the v2 bridge layer resolves the API base through environment variables (`ADMIN_URL_API_V3` / `NEXT_PUBLIC_API_V3_URL`) and does not bind API selection to the frontend host port.
- Files:
  - M boot.php
