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
- Migrated the service mapping assistant surface for `endpoint_gateway` services:
  - loads the selected gateway endpoint context from the v2 bridge;
  - reuses the endpoint test-context bridge for required variables, keeping context-resolved values read-only;
  - executes the endpoint preview and normalizes `data_array`, `data_array_sample` and raw responses into selectable test samples;
  - builds the script test payload from the selected sample as `{ data: [row] }`, matching the legacy non-dataset mode;
  - sends Razor script previews to `agilesync_build_script` with `modo=gateway_mapeamento_preview`.

## Coverage

- `src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways.test.ts`
- `app/api/erp-cadastros/gateway-endpoints/variables/route.test.ts`
- `app/api/erp-cadastros/gateway-endpoints/test-context/route.test.ts`
- `src/features/integracao-com-erp-cadastro-servicos/services/servico-mapping-assistant.test.ts`
- `app/api/erp-cadastros/servicos/mapping-assistant/test-script/route.test.ts`

## Notes

- The assistant was implemented with v2 components and existing bridges instead of copying the jQuery/ACE modal. Drag/drop insertion from the legacy JSON tree was not copied literally; the v2 keeps the sample JSON visible next to the Monaco Razor editor and validates the selected payload through the same backend preview contract.
