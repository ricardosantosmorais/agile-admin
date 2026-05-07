# Evidence: gateways-pagamento

## Legacy commits checked

- `65ac3403b` - adds Cielo 3DS fields and conditional rules.
- `27de03d9f` - preserves 3DS/client credentials when toggling the 3DS switch.
- `0b3694fa6` - remote-cache invalidation standardization across many controllers.
- `d9d4c2ebe`, `ccebc4ccf`, `4bec384a4` - safe diagnostics and JSON request mode when saving payment gateways.

## Legacy files inspected

- `assets/js/components/gateways-pagamento-form.js`
- `components/gateways-pagamento-form.php`
- `controllers/gateways-pagamento-controller.php`

## V2 comparison

- `src/features/gateways-pagamento/services/gateways-pagamento-config.tsx` already has the Cielo 3DS fields, conditional visibility, and Cielo 3DS `client_id` / `client_secret` visibility.
- `app/api/integracoes/gateways-pagamento/route.ts` already normalizes `3ds`, clears 3DS fields outside Cielo, normalizes MCC to digits, and clears Cielo client credentials when 3DS is disabled.
- `src/services/http/server-api.ts` already sends `Accept: application/json` and `Content-Type: application/json` to the API v3, so the legacy `post(..., 'json')` fix is covered in the v2 bridge layer.
- V2 uses central operational error capture through `serverApiFetch` / Sentry instead of adding gateway-specific PHP `error_log` helpers.

## Migration result

- No functional UI migration was needed for this batch.
- Added missing bridge coverage for Cielo 3DS payload normalization:
  - `app/api/integracoes/gateways-pagamento/route.ts`
  - `app/api/integracoes/gateways-pagamento/route.test.ts`

## Validation

- `.\npmw.cmd test -- app/api/integracoes/gateways-pagamento/route.test.ts src/features/gateways-pagamento/services/gateways-pagamento-config.test.ts`
  - 2 files passed
  - 4 tests passed
- `.\npxw.cmd eslint "app/api/integracoes/gateways-pagamento/route.ts" "app/api/integracoes/gateways-pagamento/route.test.ts" "src/features/gateways-pagamento/**/*.ts" "src/features/gateways-pagamento/**/*.tsx"`
  - passed
- `.\npmw.cmd run typecheck`
  - passed
