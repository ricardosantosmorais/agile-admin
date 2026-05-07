# Batch: dashboard

Commits: 1
Date range: 2026-03-25..2026-03-25

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-25 | 10cccbc85 | cache-or-assets | migrated | Reduce dashboard-v2 request pressure | 1 |

## Detailed commits

### 10cccbc85 - Reduce dashboard-v2 request pressure

- Date: 2026-03-25
- Type: cache-or-assets
- Disposition: migrated
- V2 decision: migrated as request-pressure control in the modern sequenced dashboard hook. The v2 already loads heavy/marketing sections lazily by viewport, so no visual or metric migration was needed.
- Files:
  - M assets/js/components/dashboard-v2.js
