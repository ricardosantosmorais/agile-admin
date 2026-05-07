# Evidence: autenticacao/sessao

Batch: `autenticacao-sessao`
Legacy date range: 2026-03-30..2026-04-13

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `adc91efd3` | `controllers/api-controller.php` changed cache clear to prefer `$_SESSION['usuario']['token']` and fall back to the company API token. | Migrated in `app/api/renovar-cache/route.ts`: direct cluster cache clear now sends the session token before the platform/company token fallback. |
| `65d925106` | `includes/firebase-scripts.php` removed a `console.log` that printed the Firebase current token. | Already absent in v2. Search over `app` and `src` found Firebase configuration/upload screens, but no web-push token bootstrap or token `console.log` equivalent to remove. |
| `5c4500027` | `assets/js/scripts.js` changed `ui-bootstrap` failures so `401` and `403/TENANT_CONTEXT_INVALID` open the disconnect/session modal instead of leaving the user on a broken bootstrap error. | Migrated in `src/services/http/http-client.ts`: protected app API responses with `403` and explicit `TENANT_CONTEXT_INVALID` now dispatch the global session-loss event with reason `tenant_context_invalid`. Regular 403 permission failures remain screen errors. |

## V2 files changed

- `app/api/renovar-cache/route.ts`
- `app/api/renovar-cache/route.test.ts`
- `src/services/http/http-client.ts`
- `src/services/http/http-client.test.ts`
- `docs/03-autenticacao-sessao-multiempresa.md`

## Verification

- Red run confirmed the new cache-token and tenant-context tests failed against the previous behavior.
- Green run: `.\npxw.cmd vitest run app\api\renovar-cache\route.test.ts src\services\http\http-client.test.ts`
