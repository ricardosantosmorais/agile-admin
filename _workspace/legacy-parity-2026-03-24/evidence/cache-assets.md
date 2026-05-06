# Evidence: cache/assets

## Legacy commits checked

- Batch has 26 commits from `2026-03-25` to `2026-05-02`.
- All commits change only `boot.php`.
- All changes are `ASSETS_VERSION` bumps or legacy `boot.php` restoration/version housekeeping.

## Decision

- No v2 migration is needed.
- The legacy behavior is cache-busting for PHP-rendered assets loaded through `boot.php`.
- The v2 is a Next.js application and does not use `boot.php` or `ASSETS_VERSION`.
- Equivalent cache-busting is handled by the Next.js build pipeline and generated asset filenames/manifests.
- No business rule, screen, form field, table column, API contract or user-facing workflow was introduced by this batch.

## V2 impact

- No code change.
- No tests needed because there is no runtime behavior to migrate.
- Batch remains recorded as `not-applicable-v2`.
