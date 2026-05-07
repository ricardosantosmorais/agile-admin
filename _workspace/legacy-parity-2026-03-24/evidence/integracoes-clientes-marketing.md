# Evidence: integracoes/clientes-marketing

Legacy commit checked:

- `40aa4d4c2` - `feat: ajusta integracao de clientes`

Legacy surfaces:

- `components/integracao-cliente-form.php`
- `controllers/integracao-cliente-controller.php`
- `components/integracao-marketing-form.php`
- `assets/sass/dark-theme.css`

V2 migration:

- `app/api/integracoes/clientes/route.ts`
  - Includes `cro_apikey` in the client-integration parameter read surface.
- `src/features/integracoes-clientes/services/integracao-clientes-mappers.ts`
  - Normalizes `cro_apikey`, exposes metadata and writes it as encrypted tenant parameter.
- `src/features/integracoes-clientes/components/integracao-clientes-cfo-tab.tsx`
  - Adds the CFO tab with protected API key editing and the legacy required-field instructions.
- `src/features/integracoes-clientes/components/integracao-clientes-page.tsx`
- `src/features/integracoes-clientes/components/integracao-clientes-page-state.ts`
- `src/features/integracoes-clientes/services/integracao-clientes-client.ts`
  - Wires CFO editable-secret state and save options.
- `src/features/marketing/components/integracao-marketing-rd-ecom-tab.tsx`
  - Uses semantic text token for the RD E-Commerce callback helper in light/dark themes.
- `src/i18n/dictionaries/pt-BR.ts`
- `src/i18n/dictionaries/en-US.ts`
  - Adds CFO tab, field and instruction labels.
- `docs/49-modulo-integracoes-clientes-marketing.md`
- `docs/README.md`
  - Documents the migrated scope.
- `e2e/151-integracoes-clientes.spec.ts`
  - Checks the CFO tab and legacy instruction text.

Validation:

- `.\npxw.cmd vitest run src/features/integracoes-clientes/services/integracao-clientes-mappers.test.ts`
- `.\npxw.cmd eslint app/api/integracoes/clientes/route.ts src/features/integracoes-clientes/components/integracao-clientes-page-state.ts src/features/integracoes-clientes/components/integracao-clientes-page.tsx src/features/integracoes-clientes/components/integracao-clientes-cfo-tab.tsx src/features/integracoes-clientes/services/integracao-clientes-client.ts src/features/integracoes-clientes/services/integracao-clientes-mappers.ts src/features/integracoes-clientes/services/integracao-clientes-mappers.test.ts src/features/marketing/components/integracao-marketing-rd-ecom-tab.tsx src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts e2e/151-integracoes-clientes.spec.ts`
- `.\npmw.cmd run typecheck`
- `.\npxw.cmd playwright test e2e/151-integracoes-clientes.spec.ts --project=chromium` was attempted, but the local Playwright webServer timed out after 300000ms before the spec started.
