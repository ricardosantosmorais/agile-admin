# Evidence: autenticacao/sessao

Batch: `autenticacao/sessao`
Legacy date range: 2026-03-30..2026-04-13

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `adc91efd3` | `cacheClearApi` started using the logged session token for cache clear, falling back to the company API token only when the session token is absent. | Already migrated in `app/api/renovar-cache/route.ts`: the cluster cache clear sends the authenticated session token and only falls back to the platform/company token when needed. |
| `65d925106` | Removed `console.log` of the Firebase/current notification token. | No migration needed: the v2 codebase has no equivalent FCM token logging surface. Search found no `console.log` for FCM/current token in `src`, `app` or `public`. |
| `5c4500027` | Legacy UI bootstrap handles HTTP 401 and `TENANT_CONTEXT_INVALID` by showing the session-loss modal instead of a raw bootstrap error. | Already migrated in v2 by `httpClient` and `SessionLifecycleProvider`: protected `401` and `403` with `TENANT_CONTEXT_INVALID` dispatch the global session-lost event and open the blocking session-ended flow. |

## V2 files checked

- `app/api/renovar-cache/route.ts`
- `app/api/renovar-cache/route.test.ts`
- `src/services/http/http-client.ts`
- `src/services/http/http-client.test.ts`
- `src/contexts/session-lifecycle-context.tsx`
- `docs/03-autenticacao-sessao-multiempresa.md`
- `docs/adr/ADR-003-sessao-expiracao-multiabas.md`

## Result

No code migration was needed in this batch. The legacy fixes are already represented in the current v2 authentication/session/cache architecture and covered by focused tests for renew-cache token precedence and session-loss notifications.
