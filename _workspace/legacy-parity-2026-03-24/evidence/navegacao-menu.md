# Evidence: navegacao/menu

## Legacy commits checked

- `957d6d086`, `a6eaa894b`, `f8b50c13e`, `7123ca80c`, `3380f0aa0`, `4ed10479e`, `fb3f73505`: legacy billing upgrade and financial-pending banners.
- `faa121985`, `29cbc8677`, `47e042744`, `a4a63d395`: master user menu copy rows and platform token.
- `90360a405`: hardcoded legacy menu order for Loja de Apps and Cashback.

## Decision

- Billing upgrade and financial-pending banners were not migrated. They are tied to legacy `boot.php`, `includes/header.php`, `index.php`, Redis/cache and billing controller surfaces, and v2 has no equivalent billing-upgrade shell surface by product decision.
- Hardcoded legacy menu ordering was not migrated. The affected legacy entries depend on app-store/cashback modules that do not exist as v2 routes yet.
- Master user menu token parity was migrated. The v2 user menu now loads the active tenant platform token through a protected shell bridge and renders it as a copy row only for master users.
- Deferred items are also tracked in `_workspace/legacy-parity-2026-03-24/deferred.md` so they remain visible for a future product/module decision.

## V2 changes

- `app/api/shell/tenant-debug/route.ts`: new master-only route that validates the current session and reads `agileecommerce_api_token_empresa`.
- `src/services/app-data.ts`: added `appData.shell.getTenantDebugInfo`.
- `src/components/shell/topbar.tsx`: loads and renders the token in the user menu for master users.
- `src/i18n/dictionaries/pt-BR.ts` and `src/i18n/dictionaries/en-US.ts`: added the token label.

## Tests

- `.\npxw.cmd vitest run src\components\shell\topbar.test.tsx`
- `.\npxw.cmd vitest run src\components\shell\topbar.test.tsx app\api\shell\tenant-debug\route.test.ts`
