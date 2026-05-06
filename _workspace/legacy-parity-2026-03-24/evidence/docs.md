# Batch: docs

## Legacy commits checked

- `42f91fc91` - `docs: padroniza projetos e premissas`
  - Legacy files: `AGENTS.md`, `docs/README.md`, `docs/ai/*`, `docs/projetos/*`.
  - Legacy change: repository governance and project-documentation guidance for the legacy `admin`.
- `a310d733e` - `Remove auto refresh on asset version mismatch`
  - Legacy files: `assets/js/scripts.js`, `boot.php`, `docs/architecture/navegacao-amigavel-multiempresa.md`, `tests/asset-version-refresh.test.js`.
  - Legacy change: the old admin still detects stale `ASSETS_VERSION`, but no longer forces `window.location.reload()` or a same-URL `href` refresh.

## V2 comparison

- V2 files checked:
  - `AGENTS.md`
  - `docs/README.md`
  - `docs/03-autenticacao-sessao-multiempresa.md`
  - `docs/adr/ADR-003-sessao-expiracao-multiabas.md`
  - `src/`
  - `app/`
- Search performed in v2 for asset-version and forced refresh behavior:
  - `window.location.reload`
  - `location.reload`
  - `window.location.href = window.location.href`
  - `asset_version`
  - `ASSETS_VERSION`
  - `version_mismatch`
- No v2 equivalent of the legacy `ASSETS_VERSION` mismatch auto-refresh handler was found.
- The v2 session model already documents keeping the current screen visible under session-expiration modals and only redirecting after explicit user action or real browser reload.

## Decision

- `42f91fc91`: not applicable to v2. It is a legacy repository documentation-governance change, not a product feature or behavior to migrate.
- `a310d733e`: already covered in v2. The legacy bug surface does not exist in the Next.js app, so no code/test migration is needed.

## Result

- No v2 code change required.
- No new UI, field, bridge, table column or i18n string required.
- Batch marked as completed in the parity inventory.
