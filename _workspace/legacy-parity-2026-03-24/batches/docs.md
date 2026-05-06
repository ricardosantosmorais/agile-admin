# Batch: docs

Commits: 2
Date range: 2026-03-26..2026-05-02

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-26 | 42f91fc91 | new-feature-or-screen | not-applicable-v2 | docs: padroniza projetos e premissas | 7 |
| 2026-05-02 | a310d733e | bugfix | already-covered-v2 | Remove auto refresh on asset version mismatch | 4 |

## Detailed commits

### 42f91fc91 - docs: padroniza projetos e premissas

- Date: 2026-03-26
- Type: new-feature-or-screen
- Disposition: not-applicable-v2
- V2 decision: legacy-only documentation/governance change for `C:\Projetos\admin`. The v2 already has its own `AGENTS.md` and `docs/` operating model, and no product behavior, screen, field, table column or API contract was introduced by this commit.
- Files:
  - M AGENTS.md
  - M docs/README.md
  - M docs/ai/README.md
  - M docs/ai/context-pack.md
  - M docs/ai/skills/00-skill-principal.md
  - A docs/projetos/PREMISSAS.md
  - A docs/projetos/README.md

### a310d733e - Remove auto refresh on asset version mismatch

- Date: 2026-05-02
- Type: bugfix
- Disposition: already-covered-v2
- V2 decision: the bug fixed a legacy `ASSETS_VERSION` mismatch handler that forced `window.location.reload()`. The v2 does not have an `ASSETS_VERSION` mismatch handler or auto-refresh fallback, and its session lifecycle docs already preserve the current screen without automatic redirect/reload during session end.
- Files:
  - M assets/js/scripts.js
  - M boot.php
  - M docs/architecture/navegacao-amigavel-multiempresa.md
  - A tests/asset-version-refresh.test.js
