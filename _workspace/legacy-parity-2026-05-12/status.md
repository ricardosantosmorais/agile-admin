# Legacy parity run status

Run: legacy-parity-2026-05-12
Legacy repo: C:/Projetos/admin
V2 repo: C:/Projetos/admin-v2-web
Legacy range: 99f6b7ee9..2d57cb13c
Legacy base: 99f6b7ee9
Legacy target: 2d57cb13c
Created at: 2026-05-12

## Handoff 2026-05-18

Consolidated handoff file created at `HANDOFF.md`.

Use it before opening new chats or cleaning this branch. The current consolidated reading is:

- `catalogos-digitais`: partial; still needs a dedicated continuation for studio blocks, products/collections, pricing, preview/PDF/publication and final visual validation.
- `infraestrutura-aws`: partial; v2 surfaces are prepared, but live AWS collection depends on server-side endpoints in `api-v3`.
- `agile-store-ajustes`, `pedidos-logistica`, `formularios-arquivos`, `configuracoes-admin`, `shell-docs-operacao`, `status-plataforma`, `relatorios-data-hora`, `pedidos-brinde-aprovacao` and `vendedores-valida-horario`: recorded as completed for this parity phase.
- Before any merge to `master`, reconcile this branch with the latest `origin/master` design/docs commit.

## Objective

Open a new parity phase for legacy changes merged after the previous run.
The previous run `legacy-parity-2026-03-24` remains the historical reference for completed/deferred items.

This phase should not continue blindly from the old queue. It starts from the new legacy delta and groups commits by product surface so each stage can be analyzed, migrated or explicitly recorded.

## Current state

- `master` in v2 includes the Agile Store visual/detail fix and the Apps parity record.
- The new legacy delta contains 66 commits, including merge commits.
- The dominant new surface is `Catálogos Digitais`.
- The legacy repo had a local dirty `boot.php` when this inventory was created; it was not modified by this run.
- Gap before this range closed in the previous run: `371250d5d` (`Limita altura das visitas da Agile Store`) was migrated as `agile-store/visitas-altura` in `legacy-parity-2026-03-24`.

## Recommended execution order

1. `catalogos-digitais`
2. `agile-store-ajustes`
3. `pedidos-logistica`
4. `formularios-arquivos`
5. `configuracoes-admin`
6. `infraestrutura-aws`
7. `shell-docs-operacao`

## Batch summary

| Order | Batch | Main point | Initial disposition |
|---:|---|---|---|
| 1 | `catalogos-digitais` | New digital catalog studio, permissions, publication, PDF generation, recalculation and tenant upload behavior. | analyze-first |
| 2 | `agile-store-ajustes` | Materials, posters, benefits and feedback/status UX for Agile Store. | analyze-after-current-ui |
| 3 | `pedidos-logistica` | Order cancellation by API v2, delivery branch reference and Ibolt status/menu behavior. | analyze-contracts |
| 4 | `formularios-arquivos` | File preview in form submissions and contact/info display fixes. | compare-existing-v2 |
| 5 | `configuracoes-admin` | JSON formatting in parameters, seller/customer/config masks, root/admin fixes and SQL/services fixes. | split-by-owner |
| 6 | `infraestrutura-aws` | New AWS infrastructure dashboards and EB/RDS/WAF operational helpers. | likely-new-surface |
| 7 | `shell-docs-operacao` | Session duration, route scroll reset, boot/docs/deploy operational adjustments. | mostly-applicability-check |

## Next step

`catalogos-digitais` resumed after the local/base data update. The first studio slice is migrated.

Completed in v2:

- dynamic menu component `catalogos-studio` mapped to `/catalogos-digitais`;
- feature access key `catalogosDigitais` mapped to legacy permissions;
- bridge/list client for `catalogos_digitais`;
- App Store contract lookup for `mod_catalogos_digitais`;
- v2 list page with search, status, contract warning and table.
- `Novo catalogo` action on the list;
- edit action on each catalog row;
- `/catalogos-digitais/novo` create route;
- `/catalogos-digitais/[id]/editar` edit route;
- detail bridge using `embed=produtos`;
- save bridge preserving the legacy snapshot data for products/sections;
- first studio form slice for general data and publication fields.

Next slice:

- sections, image upload, product/collection import and pricing;
- preview/PDF/publication contracts.
- final visual validation of the complete studio.

`agile-store-ajustes` completed in this slice:

- contract/cancel feedback modal with legacy motives;
- `feedback_motivo` and `feedback_mensagem` forwarded by the v2 bridge;
- feedback rendered in detail history and Agile Store admin tables;
- detail benefits fallback updated to the latest legacy metadata order;
- video poster fields mapped from the API payload;
- static legacy material files intentionally left as API-delivered URLs.

Evidence: `evidence/agile-store-ajustes-feedback.md`.

Active next batch remains `catalogos-digitais` until the remaining studio slices are closed.

`pedidos-logistica` completed in this slice:

- order cancellation now follows the latest legacy flow as a cancellation request (`cancelar: 1`, `internalizar: 0`) with operational log;
- list/detail cancellation action is blocked when the API record already has `cancelar` marked;
- `formas-entrega` gained `filial_referencia_entrega` with `estoque`/`faturamento` options and safe default to `estoque`;
- IBoltt no longer offers `recebido` / `Pedido Recebido` as call status.

`formularios-arquivos` completed in this slice:

- uploaded form files now preserve the active tenant when opened through the legacy viewer;
- form submission detail/export bridges include `id_empresa` in generated file URLs;
- customer additional-form files and contact additional-form files render as viewer links instead of raw stored paths;
- seller configuration percentage fields load with localized decimal masks while preserving normalized save payloads.

`configuracoes-admin` completed in this slice:

- parameter JSON save now formats valid JSON with the same 4-space output used by the legacy Ace formatter;
- order settings now use rich text editors for `mensagem_bloqueio_pedidos` and `mensagem_aceite_pedidos`, with empty editor placeholders normalized before save;
- ERP service registration now resolves `tipo_objeto=script` through lookup and label hydration;
- Administradores Master and Editor SQL were recorded as covered by the current v2 flow, with no direct migration required.

`infraestrutura-aws` routing/access slice completed, but functional migration remains open:

- latest legacy components `infraestrutura-saude-plataforma` and `infraestrutura-financeiro-aws` now resolve to v2 routes;
- root menu `Infraestrutura` now matches the legacy entries instead of the previous `Servidores de API` placeholder;
- Financeiro AWS keeps the legacy e-mail allowlist rule;
- functional AWS execution remains pending for a dedicated server-side bridge/service because it involves AWS credentials, assume-role and EB log archives;
- pending legacy controller actions: health `snapshot`, `accounts`, `compute`, `rds`, `redis`, `metric_series`, `alerts`, `waf_ip_sets`, `save_waf_ip_sets`, `download_eb_logs`; finance `snapshot`, `costs`, `commitments`, `reservation_coverage`, `services`.

Next batch after this checkpoint: `shell-docs-operacao`.

`shell-docs-operacao` completed in this slice:

- v2 session lifecycle fallback now follows the latest legacy 8-hour idle timeout;
- v2 HTTP-only auth cookie now also uses the same `28800s` max duration instead of the previous 12-hour TTL;
- session docs were updated from `7200s` to `28800s`;
- legacy EB Chrome install for catalog PDFs was registered as not directly applicable to v2 because the current route generates PDF server-side with `jspdf`;
- legacy `boot.php` asset-version bumps and `loadComponent` scroll reset were registered as not applicable/already covered by the v2 architecture;
- the configuracoes-pedidos merge from this batch was already closed in `configuracoes-admin`.

`infraestrutura-aws` backend execution is explicitly deferred:

- `Saude da Plataforma` and `Financeiro AWS` remain pending until `api-v3` exposes the equivalent server-side endpoints.
- The v2 surfaces, routes and mappers can stay prepared, but the module must not be marked fully migrated while live AWS collection still depends on the legacy PHP controller.

Next checkpoint: refresh the legacy master delta and generate the next parity list, keeping `infraestrutura-aws` as a tracked backend dependency instead of blocking the next frontend migration batch.

`status-plataforma` completed in this slice:

- refreshed the legacy master delta after `2d57cb13c` and identified `Status da Plataforma` as the next non-infra block;
- confirmed the legacy topbar status uses `api-v3` `/status/tenant-health`, unlike the deferred AWS infrastructure dashboards;
- added a v2 shell bridge at `/api/shell/platform-status`, preserving the active-tab tenant context;
- updated the access rule after the latest legacy change, exposing status to authenticated admin users instead of the previous e-mail allowlist;
- normalized the legacy service order/status summary in `src/features/shell/services/platform-status.ts`;
- replaced the local topbar indicator with a real platform-status popover for admin users;
- added `/status-plataforma` as the v2 operational page and mapped the legacy component in the dynamic menu.

Next checkpoint: continue the refreshed legacy delta after the `Status da Plataforma` block.

`relatorios-data-hora` completed in this slice:

- migrated legacy commit `a5dec3a79` (`ajuste de data e hora nos campos dos relatorios`);
- `data_hora` dynamic report filters now behave like `data` in the v2 report process modal;
- the draft state now uses `__start` and `__end` for `data_hora`;
- the process bridge now records `data_hora` as `ge`/`le` operators instead of text `lk`;
- targeted mapper, bridge and component tests were added.

Next checkpoint: analyze the remaining refreshed legacy commits for order gift approval and seller schedule validation.

`pedidos-brinde-aprovacao` completed in this slice:

- migrated legacy commit `1e69cf3b4` (`Inclusão de Lógica para mudança de status ao aprovar pedidos com brinde`);
- v2 manual approval now keeps the main order flow and then checks `id_transacao`;
- the bridge reads `internaliza_brinde` from `empresas/parametros`;
- pending gift orders from the same transaction are approved with status/log/update calls;
- gift `internalizar` follows `internaliza_brinde`, preserving the legacy operational rule.

Next checkpoint: analyze `6cb70a741` for seller `valida_horario`.

`vendedores-valida-horario` completed in this slice:

- migrated legacy commit `6cb70a741` (`Adiciona flag de horario no vendedor`);
- seller create/edit now includes `valida_horario` in form state, detail mapping and save payload;
- new sellers default the flag to enabled, matching the legacy checked switch;
- the general seller form now shows `Valida Horário` in the same position as the legacy form, after `Bloqueado`;
- targeted mapper tests cover default, hydration and serialization.

Next checkpoint: continue the refreshed legacy delta after seller schedule validation.
