# Batch: .ebextensions

Commits: 1
Date range: 2026-05-02..2026-05-02

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-05-02 | 174c82e4b | new-feature-or-screen | not-applicable-v2 | Ajusta health check do admin para ignorar 4xx | 1 |

## Detailed commits

### 174c82e4b - Ajusta health check do admin para ignorar 4xx

- Date: 2026-05-02
- Type: new-feature-or-screen
- Disposition: not-applicable-v2
- V2 decision: ignored by product decision. The commit adds Elastic Beanstalk health-reporting configuration to the legacy admin, while `admin-v2-web` has no `.ebextensions` directory and uses a different deployment surface.
- Files:
  - A .ebextensions/health-reporting.config
