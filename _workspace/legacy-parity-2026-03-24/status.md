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
- Sixth batch checked: `simulador-precos`.
- Price simulator already had the new freight field and API v2 route; the remaining migration was freight normalization in the bridge so masked Brazilian values and already-normalized decimal values are both forwarded correctly.
- Seventh batch checked: `pedidos`.
- Orders needed parity for delivery statuses, payment-interest configuration, master-only technical logs, and master product technical artifacts in the order detail.
- Eighth batch checked: `condicoes-pagamento`.
- Payment terms needed parity for `Restrições` and `Exceções`, including occurrence scopes, active/date fields, dedicated bridges, and synchronized-record protection through `id_sync`.
- Ninth batch checked: `filiais`.
- Branches needed parity for `seleciona_filial` profile options, complementary branch fields, branch-group invoice branch and price table lookups, and lookup label restoration through form embeds. `exibe_precos_filial` had already been migrated to `Configuracoes > Produtos`.
- Tenth batch checked: `formularios`.
- Forms needed parity for segmented cache invalidation after successful `formularios` and `formularios_campos` mutations. Form submissions needed contact fallback in list/detail/export, customer/contact search parity, and legacy export metadata.
- Eleventh batch checked: `integracao-erp/servicos`.
- ERP services needed dataset-consolidado parity in service registration payload/field visibility and log-modal copy/download actions. Abort execution tenant context, execution-detail pagination reset and lazy operational loading were already covered in v2. Protheus header diagnostics were not applicable to this v2 screen.
- Twelfth batch checked: `configuracoes`.
- Configurations needed Área Representante V2 parity in seller settings and seller registration quota enforcement. Product assistant stock and general fixed options were already covered in v2; legacy cache publication initialization was not directly applicable.
- Thirteenth batch checked: `contatos`.
- Contacts needed administrative editing for non-internalized contacts, bridge-side protection against editing internalized contacts, and the duplicated-contact registration parameter in customer settings. The billing-upgrade contact separator change was not applicable to this v2 batch.
- Fourteenth batch checked: `controllers`.
- Controllers needed Editor SQL execution parity through PainelB2BApi, full-cache invalidation after Componentes/Componentes Campos/Areas de Pagina mutations, and remote-cache failure observability. The billing-upgrade banner gate is not applicable because the v2 has no equivalent billing-upgrade surface.
- Fifteenth batch checked: `dashboard`.
- Dashboard did not need new visual or metric migration because v2 already loads sections by phase and viewport. The remaining parity was request-pressure hardening: dedupe identical in-flight snapshot calls, abort stale cycles through `AbortSignal`, and ignore obsolete responses.
- Sixteenth batch checked: `docs`.
- Docs had no functional v2 migration. The project-governance commit was legacy-only documentation, and the `ASSETS_VERSION` auto-refresh bug is already absent from the v2 architecture.
- Seventeenth batch checked: `.ebextensions`.
- Elastic Beanstalk health-reporting configuration is legacy infrastructure only and was ignored by product decision because v2 has no `.ebextensions` deployment surface.
- Eighteenth batch checked: `geral`.
- Local admin port `8080` support is already covered by the v2 architecture because bridge API URLs come from environment variables instead of `HTTP_HOST`/frontend port checks.
- Nineteenth batch checked: `.gitignore`.
- The legacy local admin log ignore entry is already covered by the v2 `.gitignore` because `*.log` is ignored globally.
- Twentieth batch checked: `includes`.
- Includes needed friendly product-origin trace parity in `Pedidos`: v2 now translates tracked fields, final values, rule names, rule codes, technical origins and descriptions while keeping the complete JSON below for audit.
- Twenty-first batch checked: `integracoes-clientes-marketing`.
- Clientes/Marketing needed CFO API-key parity and RD E-Commerce dark-mode contrast parity: v2 now exposes a CFO tab in `Integrações > Clientes`, persists `cro_apikey` as encrypted tenant parameter and uses semantic theme text for the RD callback helper.
- Twenty-second batch checked: `navegacao-menu`.
- Navegação/menu precisou de paridade para o token no menu do usuário master: v2 agora expõe o token da empresa ativa no menu do usuário por uma bridge de shell exclusiva para master. Banners legados de billing/pendência financeira e ordenação hardcoded de Loja de Apps/Cashback não foram migrados porque ainda não existe superfície equivalente no shell/módulos do v2.
- Next step: continue with the next uncompleted inventory batch after `navegacao-menu`: `processos-relatorios`.

## Completed batches

- `gateways-pagamento`: no functional migration needed; added Cielo 3DS bridge tests.
- `importar-planilha/processos-arquivos`: migrated `integra_planilha` field filtering in spreadsheet mapping and added mapper test coverage.
- `notificacoes-painel`: migrated channel options, selected-company link behavior, channel-aware publishing, and audience channel display.
- `integracao-erp/gateway-endpoints`: migrated OAuth2Cookie/cookie-token parity and masked read-only context variables for endpoint testing.
- `integracao-erp/interfaces-consulta`: migrated consultation-map normalization for filter/order application mode and value-resolution config in template and override saves.
- `simulador-precos`: migrated freight normalization in the API v2 bridge and added regression coverage for freight and packaging query format.
- `pedidos`: migrated delivery statuses `devolvido`/`solicitado`, `exibe_juros_parcelas`, master-only filtering for technical logs, and master product actions for price memory/origin trace payloads.
- `condicoes-pagamento`: migrated restriction/exception tabs, occurrence mappers, bridges, i18n/docs/E2E coverage, and `id_sync` edit/delete protection.
- `filiais`: migrated `seleciona_filial` profile options, complementary branch fields, UF/list normalization, table-price lookup, branch-group invoice branch/table-price lookups, i18n/docs, and regression coverage.
- `formularios`: migrated segmented cache invalidation for forms/form fields, contact fallback in form submissions, customer/contact search parity, export metadata, and bridge regression coverage.
- `integracao-erp/servicos`: migrated dataset-consolidado conditional fields/payload cleanup in `Cadastros ERP > Serviços`, added copy/download actions to the execution log modal, and recorded already-covered operational parity for abort, pagination reset and lazy loading.
- `configuracoes`: migrated seller Área Representante V2 parameters, master-only seller quota setting, decimal/null payload normalization, `area_vendedor` in seller registration and bridge-side quota enforcement.
- `contatos`: migrated administrative contact editing for non-internalized contacts, payload normalization, bridge-side internalized-contact blocking, and `permite_cadastro_contato_duplicado` in `Configurações > Clientes`.
- `controllers`: migrated Editor SQL execution to always use PainelB2BApi, full-cache invalidation after Componentes/Componentes Campos/Areas de Pagina mutations, and Sentry observability for remote-cache cluster failures.
- `dashboard`: migrated request-pressure control with in-flight dedupe, stale-cycle aborts and `AbortSignal` propagation while preserving the existing v2 phase/viewport loading model.
- `docs`: no functional migration needed; legacy project-documentation governance is repository-specific and the legacy `ASSETS_VERSION` auto-refresh bug surface is absent from v2.
- `.ebextensions`: no migration needed; legacy Elastic Beanstalk 4xx health-reporting configuration is not applicable to v2 and was ignored by product decision.
- `geral`: no migration needed; legacy local-port `8080` API routing is already covered in v2 by env-based API base URL resolution.
- `.gitignore`: no migration needed; legacy `tmp/admin-local.log` ignore is already covered by the v2 `*.log` rule.
- `includes`: migrated friendly product-origin trace summaries in the order detail technical modal, with rule/field/source catalog parity, i18n labels, docs and mapper coverage.
- `integracoes-clientes-marketing`: migrated CFO tab/API key support in client integrations, added encrypted `cro_apikey` payload parity, aligned RD E-Commerce helper contrast to theme tokens, and updated i18n/docs/E2E coverage.
- `navegacao-menu`: migrated master user-menu token parity through a protected shell route and copy row, with UI/route coverage; legacy billing upgrade/financial banners and app-store/cashback hardcoded ordering were recorded as not applicable to current v2 surfaces.

## Known local noise excluded

- .playwright-mcp/
- whatsapp-light-after.png
