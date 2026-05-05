# Legacy parity run status

Run: legacy-parity-2026-03-24
Legacy repo: C:/Projetos/admin
V2 repo: C:/Projetos/admin-v2-web
Base date: 2026-03-24

## Current state

- Inventory generated from legacy git history.
- First batch checked: `gateways-pagamento`.
- Second batch checked: `importar-planilha/processos-arquivos`.
- Gateways 3DS behavior was already present in v2; missing bridge coverage was added.
- Spreadsheet import mapping needed the legacy field-level `integra_planilha` filter; v2 now filters dictionary fields in the mapper with regression coverage.
- Third batch checked: `notificacoes-painel`.
- Panel notifications needed channel parity: remove `novidades`, validate `admin/email/todos`, publish push/e-mail by channel, link selected companies without unwanted push for e-mail-only notifications, and load audience from the channel-aware endpoint.
- Fourth batch checked: `integracao-erp/gateway-endpoints`.
- Gateway endpoints needed OAuth2Cookie parity, fixed `@oauth2.cookie` discovery, automatic cookie exclusion from test variables, and masked read-only company-context variables in endpoint testing.
- Fifth batch checked: `integracao-erp/interfaces-consulta`.
- Interfaces consulta already had most of the legacy module surface in v2; the remaining migration was bridge normalization for consultation map fields introduced by the legacy commits.
- Next step: open the next inventory batch after ERP interfaces, choosing the smallest cohesive module group with actionable v2 impact.

## Completed batches

- `gateways-pagamento`: no functional migration needed; added Cielo 3DS bridge tests.
- `importar-planilha/processos-arquivos`: migrated `integra_planilha` field filtering in spreadsheet mapping and added mapper test coverage.
- `notificacoes-painel`: migrated channel options, selected-company link behavior, channel-aware publishing, and audience channel display.
- `integracao-erp/gateway-endpoints`: migrated OAuth2Cookie/cookie-token parity and masked read-only context variables for endpoint testing.
- `integracao-erp/interfaces-consulta`: migrated consultation-map normalization for filter/order application mode and value-resolution config in template and override saves.

## Known local noise excluded

- .playwright-mcp/
- whatsapp-light-after.png
