# integracao-erp/gateway-endpoints

Legacy commits checked:

- `64646a042` - Ajusta assistente de mapeamento de endpoint gateway
- `f0cdc9ba6` - feat: expose oauth2 cookie gateway auth

## Migrated to v2

- Added `OAuth2Cookie` to the gateway authentication options used by the modern ERP gateway registration.
- Exposed fixed token `@oauth2.cookie` in gateway endpoint variable discovery.
- Ignored `@oauth2.cookie` in the endpoint test-context variable form, matching the legacy contract where the engine supplies this value automatically.
- Marked company-context variables from `empresas/parametros` as read-only, masked values in the endpoint test form.
- Prevented context-resolved variables from being sent as manually typed test variables.

## Coverage

- `src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways.test.ts`
- `app/api/erp-cadastros/gateway-endpoints/variables/route.test.ts`
- `app/api/erp-cadastros/gateway-endpoints/test-context/route.test.ts`

## Legacy behavior not directly migrated in this batch

- The legacy sample-row selector in the service mapping assistant depends on a full assistant UI in `servicos-integracao-form`. The current v2 service screen still uses the script editor flow, so this batch migrated the shared endpoint/gateway contract pieces that already have a v2 surface.
