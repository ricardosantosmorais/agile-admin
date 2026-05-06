# Evidence: processos-relatorios

## Legacy commits checked

- `f1d5ed69a`: adjusts report-process download URL to include the tenant from the active tab context.
- `89317e26b`: removes `target="_blank"` so the download runs in the same browser tab.

## Decision

- No production migration was needed. The v2 report-process download already uses `fetchWithTenantContext`, which attaches the active tab tenant header to `/api/*` calls.
- The v2 backend already resolves the active tenant through `readAuthSession()` and blocks downloads when the process `id_empresa` does not match the active tenant.
- The v2 UI already downloads through `blob` plus an invisible `anchor.download`, so it triggers the file download in the current tab instead of opening a new browser tab.
- The missing part was explicit test coverage for the download route.

## V2 evidence

- `src/features/relatorios/components/relatorio-preview-page.tsx`: `openDownload()` calls `fetchWithTenantContext('/api/processos-relatorios/{id}/download')`, reads the `Content-Disposition` filename and triggers `anchor.download`.
- `src/services/http/tenant-context.ts`: `fetchWithTenantContext()` adds the active tab tenant header for `/api/*` requests.
- `src/features/auth/services/auth-session.ts`: `readAuthSession()` overrides the cookie tenant with the active tab tenant header when present.
- `app/api/processos-relatorios/[id]/download/route.ts`: validates `processo.id_empresa` against the resolved tenant and returns an attachment response.

## Tests

- Added `app/api/processos-relatorios/[id]/download/route.test.ts`.
- Covered active-tab tenant mismatch returning `403` without S3 access.
- Covered a valid active-tab tenant returning an attachment with the expected filename and S3 object.
- Validation command: `.\npxw.cmd vitest run app\api\processos-relatorios\[id]\download\route.test.ts`.
