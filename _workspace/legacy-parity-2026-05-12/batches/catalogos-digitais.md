# Batch: catalogos-digitais

Initial priority: 1
Initial disposition: analyze-first

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-07 | 8407206ef | Adiciona studio de catalogos digitais |
| 2026-05-07 | 6da0b69f2 | Restringe catalogos digitais ao usuario autorizado |
| 2026-05-07 | c327433a2 | Libera catalogos digitais para usuario local |
| 2026-05-07 | 775bd6a65 | Restaura Catálogos Digitais e preserva ajustes remotos |
| 2026-05-07 | 3148bb3f4 | Remove fallback local dos produtos nos catálogos |
| 2026-05-07 | c06bd6f42 | Ajusta consulta de produtos dos catalogos pela API |
| 2026-05-08 | 0e2338556 | Finaliza preparo de produção dos catálogos digitais |
| 2026-05-08 | dd96f9a63 | fix: preserve catalog mock json in loja demo seed |
| 2026-05-08 | 58e8aae63 | feat: publicar catalogos digitais no admin |
| 2026-05-08 | d1dd9058a | Ajusta catalogos digitais e loja de apps |
| 2026-05-09 | 5a549409d | Atualiza poster do video de Catalogos Digitais |
| 2026-05-09 | 7c2f1dd7d | Protege Catalogos Digitais por contratacao |
| 2026-05-09 | 05fc0eaa8 | Libera saidas de Catalogos Digitais sem contratacao |
| 2026-05-09 | 0873772b4 | Corrige geração de PDF dos catálogos |
| 2026-05-09 | 72e82b105 | Corrige renderizacao de imagens e HTML em catalogos |
| 2026-05-10 | 815266a8f | Corrige imagem de produto integrado em catalogos |
| 2026-05-10 | 10fc5694e | Usa credenciais do tenant no upload de catalogos |
| 2026-05-10 | 597d6531d | Corrige contexto de recalculo em catalogos |
| 2026-05-10 | 394cf9635 | Corrige correspondencia de produtos no recalculo |
| 2026-05-10 | c3da19496 | Inclui bloco em edicao no recalculo de catalogos |
| 2026-05-10 | ddd01e4f5 | Corrige resolucao de cliente em catalogos |
| 2026-05-10 | 37816f99e | Robustece recalculo de precos em catalogos |
| 2026-05-10 | 41f8cbc1d | Exibe motivo do recalculo sem preco |
| 2026-05-10 | 3e494d345 | Corrige recalculo de catalogos integrados |
| 2026-05-10 | a9225a451 | Corrige cliente salvo no recalculo de catalogos |
| 2026-05-11 | 086d39048 | fix(admin): permitir pdf de catalogos demo sem snapshot |
| 2026-05-11 | 0dfd81d1e | fix(admin): ajustar validacao final dos catalogos digitais |
| 2026-05-11 | a9400ae8a | fix(admin): liberar catalogos digitais por funcionalidade |
| 2026-05-11 | 66adb455c | fix(admin): remover trava de email dos catalogos digitais |
| 2026-05-11 | 9204d7b10 | fix(admin): liberar menu de catalogos por funcionalidade |

## Main legacy files

- `components/catalogos-digitais.php`
- `components/catalogos-digitais-list.php`
- `components/catalogos-studio.php`
- `controllers/catalogos-studio-controller.php`
- `assets/js/components/catalogos-studio.js`
- `includes/catalogos-digitais-permissions.php`
- `scripts/sql/2026-05-04-catalogos-digitais-studio-permissoes.sql`
- `scripts/dev/qa_catalogos_digitais*.js`
- `assets/app-store/catalogos-digitais/*`

## Questions to answer before migration

- Does v2 already have any surface for digital catalogs, or is this a new module?
- Which backend/API owns catalog persistence and publication?
- Which assets/materials are data from API versus static legacy files?
- Is PDF generation expected inside v2, through an API bridge, or outside the frontend?
- How does access work: by contract, functionality, local user and menu permission?

## Initial recommendation

Analyze this batch first and split it into implementation slices:

1. Route/menu/access and read-only list.
2. Studio/editor UI and data contract.
3. Products/customer/recalculation behavior.
4. Publication/PDF/materials.
5. Contract/functionality restrictions and tests.

## Paridade obrigatória do batch

Este batch não deve ser considerado completo por tela enquanto houver função do legado sem equivalente no v2. Cada tela precisa ser migrada integralmente, incluindo botões, ações por linha, ações em massa, textos, campos, filtros, colunas, modais, permissões, payloads, validações e mensagens.

Quando uma função depender de endpoint/backend ainda inexistente, registrar a pendência com o contrato necessário. Quando existir no backend legado e houver contrato viável no v2/API bridge, migrar o equivalente necessário em vez de ocultar a funcionalidade.

Para a listagem de catálogos, a comparação obrigatória inclui:

- ações por linha do legado em `assets/js/components/catalogos-studio.js`: `preview-catalog` (Prévia), `copy-catalog` (Copiar), `edit-catalog` (Alterar) e `delete-catalog` (Excluir);
- ação em massa `cs-btn-delete-selected`, exibida conforme permissão de deletar e seleção marcada;
- checkbox de seleção por linha e selecionar todos;
- link externo no nome quando `url_publica`, `publicado` e status `pronto` estiverem presentes;
- botões de filtro/limpeza e textos/estados da DataTable;
- permissões legadas `listar`, `criar`, `editar` e `deletar`;
- contratação via `mod_catalogos_digitais`, mantendo listagem administrativa quando o módulo não estiver contratado.

## Progress - 2026-05-18

Slice migrated in `codex/catalogos-digitais-studio-slice`:

- Studio step `Blocos` now has a basic section/block editor in the v2 form.
- Supported legacy section types were mapped for creation/editing: `banner`, `titulo`, `produtos_grid`, `produtos_lista`, `texto`, `cta`, `divisor`, `espacador` and `quebra_pagina`.
- The editor supports section model, title/subtitle, image URL, colors, spacing, font size, product IDs for product sections, rich HTML fields for text/CTA and show-price flag for product sections.
- Created blocks can be edited, reordered and removed without leaving the form.
- `sections` are saved back into the legacy `metadata.snapshot.secoes` contract, preserving the snapshot-based backend flow.
- PT/EN dictionary entries were added for the new UI labels and accessible icon-button names.

Evidence:

- Legacy comparison: `components/catalogos-studio.php`, `controllers/catalogos-studio-controller.php`, `assets/js/components/catalogos-studio.js`.
- v2 tests: `src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx`, `src/features/catalogos-digitais/services/catalogos-digitais-mappers.test.ts`.
- Evidence note: `evidence/catalogos-digitais-blocos.md`.
- Lost action-buttons evidence: `evidence/catalogos-digitais-list-actions-lost-blob.md`.

Additional recovery on 2026-05-18:

- reimplemented the legacy list actions recovered from the unreachable Git blob:
  - `Prévia/Visualizar` opens the public catalog URL when available;
  - `Copiar` loads the catalog detail, clears identity/code and saves a copy with `(cópia)` in the name;
  - `Excluir` by row opens a confirmation modal and calls the v2 bridge;
  - checkbox selection and bulk delete were restored through `AppDataTable`;
- added `DELETE /api/catalogos-digitais` bridge using tenant context in the payload;
- added component/API tests covering preview, copy, row/bulk delete and tenant-aware delete payload.

Pending after this slice:

- completar a listagem apenas no que ainda depende de validação visual final em PT/EN, desktop/mobile, light/dark;
- precificação/recalculation with customer/commercial context;
- PDF generation and publication outputs;
- full functional validation with real operational data;
- full visual validation in PT/EN, desktop/mobile, light/dark after the remaining Studio flows are implemented.

Progress - 2026-05-19 authenticated visual/functional validation:

- Local authentication was confirmed working and the module was accessed through the real menu path `Catalogo > Catalogos Digitais`.
- The list was validated in PT desktop/light with real tenant/demo data, module-not-contracted warning, table actions, pagination and disabled `Novo catalogo` state.
- Editing `DEMO-CAT-001` was validated through the main Studio steps: `Geral`, `Blocos` and `Resumo`.
- Blocks loaded with 6 sections and 12 snapshot products; the product-block editor exposed search, code/ID resolution, collection import and selected-products state.
- Code/ID resolution was exercised with `2435 3118`; the live tenant API returned products, but the returned names differ from the demo snapshot names, so product validation remains partially dependent on aligned operational data.
- The pricing context panel loaded commercial options and `Recalcular precos` returned controlled feedback (`0 produtos precificados.`) without console errors.
- EN desktop/light was validated for the list and edit entry path; the module labels/actions were translated while snapshot product/catalog content remained tenant data.
- Evidence was recorded in `evidence/catalogos-digitais-validacao-visual-funcional-2026-05-19.md` with screenshots under `evidence/screenshots/`.

Follow-up - 2026-05-19 preview/PDF/publication:

- Rechecked PDF/publication against the legacy controller, v2 routes and API v3 models/schema.
- The legacy `pdf` action renders HTML and uses Chrome/Chromium headless in PHP to return a PDF blob; publication persists `modo_publicacao`, `restrito`, `publicado` and derives the public URL.
- The current v2/API surface exposes CRUD, generation metadata (`pdf_url`/`html_url`) and HTML preview, but no real endpoint to generate PDF or publish/update the public page from the v2 snapshot.
- PDF generation and publication outputs remain a formal backend contract gap; no fake implementation was added.
- `Prévia do rascunho` was adjusted to open `about:blank` synchronously before `previewDraft`, then write the returned HTML into the opened tab.
- Authenticated Browser/Playwright validation confirmed the draft preview opens a new observable tab titled `Agile B2B | Campanha B2B com Preço`.
- Desktop/dark and mobile 390x844/dark were rechecked through MCP Playwright with the edit/resumo content accessible.
- Evidence was recorded in `evidence/catalogos-digitais-preview-pdf-publicacao-2026-05-19.md`.

Pending after this follow-up:

- legacy visual comparison remains pending because no rendered legacy environment was available in this round;
- positive pricing still needs aligned product/customer/branch/table data;
- PDF generation and publication outputs remain pending until a real v2/backend contract exists.

Progress - 2026-05-18 pricing:

- Investigated the legacy `precificacaoOptions`, `precificarProdutos` and `precificarSnapshot` flow before implementing the v2 slice.
- Mapped the real API v2 pricing contract through `produtos`, including tenant, product filter, packaging, quantity, customer, branch, price table, seller, payment form/condition, condition index and item freight.
- Reused the existing v2 `agileV2Fetch` helper already used by `app/api/consultas/simulador-precos/route.ts`.
- Added `POST /api/catalogos-digitais/studio` actions:
  - `pricingOptions` / `precificacaoOptions`;
  - `priceProducts` / `precificarProdutos`;
  - `priceSnapshot` / `precificarSnapshot`.
- The `Resumo` step now exposes a minimal commercial pricing context and a `Recalcular precos` action.
- Recalculation sends the current builder snapshot, preserves product/section snapshot data and writes priced products back before saving the catalog.
- Focused coverage was expanded for the bridge, client and UI pricing flow.

Pending after this slice:

- PDF generation and publication outputs remain pending because the current v2 contract covers HTML preview/rendering but not a real PDF/publication pipeline equivalent to the legacy `pdf` action and publication state updates.
- Complete functional validation with real operational data.
- Complete visual comparative validation with the legacy Studio in PT/EN, desktop/mobile and light/dark.

Progress - 2026-05-18 products and draft preview:

- Migrated the Studio product search/resolution/import slice after rechecking the legacy controller/actions.
- Added `POST /api/catalogos-digitais/studio` with actions:
  - `searchProducts`, using `produtos` with legacy-like filters over product name, code and ID;
  - `resolveProducts`, splitting whitespace/comma/semicolon/pipe lists and returning `not_found`;
  - `searchCollections`, preserving the legacy collection lookup contract for future UI expansion;
  - `importCollection`, loading `colecoes?embed=produtos`, resolving products and preserving the collection order;
  - `previewDraft`, rendering an HTML preview from the current unsaved builder snapshot.
- The v2 Studio block editor now lets the user search products, resolve code/ID lists, import a collection by ID and add products to product sections without dropping the product snapshot.
- The Resumo step now has `Prévia do rascunho`, opening the rendered HTML in a new tab from the current form state, including an unsaved section draft when present.
- PT/EN dictionary entries were added for the new controls and feedback messages.
- Focused tests cover the route contracts, product insertion into a block and draft preview generation.

Pending after this slice:

- precificação/recalculation with customer/commercial context: still pending because the legacy flow calls API v2 with customer, branch, price table, seller, payment form/condition, index and freight context; no equivalent catalog-level v2 bridge was implemented in this slice;
- PDF generation and publication outputs: still pending as a real contract decision, because the v2 currently has HTML preview rendering but not the full legacy PDF/publication pipeline;
- complete functional validation against real operational data;
- visual comparative validation against the legacy Studio in PT/EN, desktop/mobile, light/dark.

Progress - 2026-05-18 list parity follow-up:

- `Copiar` now follows the legacy `can("criar")` rendering rule even when `mod_catalogos_digitais` is not contracted; the action itself keeps the module-required guard before detail/save calls.
- Catalog names now become external public links only with the same legacy condition: `url_publica`, `publicado` and `status === "pronto"`.
- The preview action uses that same public-link condition; when it is not met, the v2 registers the HTML preview as pending on the missing Studio-equivalent bridge instead of silently opening a non-public URL.

Progress - 2026-05-18 HTML preview bridge:

- Added `GET /api/catalogos-digitais/[id]/preview-html` to fetch the active-tenant catalog detail with `embed=produtos` and render an HTML preview from the saved `metadata.snapshot`.
- `Prévia/Visualizar` on the list now opens this bridge when the legacy public URL rule is not satisfied.
- This closes the list action gap for saved snapshots without `url_publica`; the Studio builder still needs PDF/publication flow before the full module can be marked complete.

Progress - 2026-05-18 block image upload:

- Migrated the Studio block image upload equivalent to legacy `uploadImagemSecao`.
- The v2 block editor now uses the shared `AssetUploadField` instead of a raw image URL input.
- Uploads go through the shared `/api/uploads` bridge with `profileId=tenant-public-images`, folder `catalogos-digitais/<tenantId>`, active tenant bucket URL and tenant context headers.
- Image validation now blocks unsupported formats before upload and keeps the legacy 5 MB limit for JPG, PNG, GIF and WEBP.
- The returned public URL is stored in `section.banner_url` and saved in the same snapshot section payload already used by the Studio slice.
- Focused coverage was added for the client upload contract and for the form flow that uploads, previews and saves a block image.

Pending after this slice:

- completar a listagem apenas no que ainda depende de validação visual final em PT/EN, desktop/mobile, light/dark;
- precificação/recalculation with customer/commercial context;
- PDF generation and publication outputs;
- full functional validation with real operational data;
- full visual validation in PT/EN, desktop/mobile, light/dark after the remaining Studio flows are implemented.
