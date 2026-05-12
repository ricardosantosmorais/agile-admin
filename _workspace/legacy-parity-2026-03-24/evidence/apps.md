# Evidence: apps

Legacy commits checked:

- `f08412579`: changed Apps GitHub flows from `feat/multi_app` to `develop`.
- `c28adc182`: removed legacy PHP `boot.php` app-level HTTPS redirect.
- `017723209`: stabilized the legacy Apps logs modal and fixed list order/filter mapping for `Nome` and `Identificador`.

V2 comparison:

- GitHub branch parity is already covered by `app/api/apps/_apps-github.ts`, where `ADMIN_APPS_GITHUB_BRANCH` falls back to `develop`.
- Apps list/form/logs already exist in `src/features/apps`.
- The v2 list uses `CrudListPage` and `APPS_CONFIG`; `nome_app` and `identificador_app` have distinct `sortKey` and filter keys matching the corrected legacy mapping.
- The logs UI is a React `AppsLogsModal` controlled by state in `AppsListPage`, so it does not reuse the legacy dynamic `#log_app` container or jQuery delegated handlers that caused duplicate modal behavior.
- The legacy HTTPS redirect removal is not applicable to v2 because the Next.js app does not use the PHP `boot.php` redirect surface.

Decision:

- No production migration needed for this batch.
- Batch can be marked as checked and covered by current v2 architecture.
