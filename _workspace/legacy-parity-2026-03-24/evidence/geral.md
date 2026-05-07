# Batch: geral

## Legacy commit checked

- `ddc50c41d` - `fix: support local admin on port 8080`
  - Legacy file: `boot.php`
  - Legacy change: extends the local-host detection from `localhost:8888` to also accept `localhost:8080` and `127.0.0.1:8080`, so the legacy admin points to local API URLs when served on port `8080`.

## V2 comparison

- V2 files checked:
  - `.env.example`
  - `src/services/http/server-api.ts`
  - `app/api/auth/login/route.ts`
  - `next.config.ts`
- V2 API base resolution:
  - `ADMIN_URL_API_V3`
  - `NEXT_PUBLIC_API_V3_URL`
  - fallback `http://localhost:9001/`
- V2 loopback login IP normalization already handles `127.0.0.1` and `localhost` without depending on the frontend port.

## Decision

- Already covered by v2 architecture.
- No migration required because the Next.js app does not choose API URLs from `HTTP_HOST` or from the UI dev-server port.

## Result

- No code change required.
- Batch marked as completed in the parity inventory.
