# Evidence: banners/universos

Batch: `banners/universos`
Legacy date range: 2026-04-22..2026-04-22

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `6e4310d86` | Added banner display universes for `marca`, `departamento`, `fornecedor` and `colecao`, including form fields, autocomplete initialization and payload ids. | Already migrated in `CatalogUniversosTab` and `BannerFormPage`: these types are in the v2 universe order, have lookup resources, value rendering, payload fields and form embed relationships. |
| `3d5d50754` | Allowed the new banner universe autocompletes to open without typed input by passing `minimumInputLength: 0`. | Already covered by the v2 `LookupSelect`: opening the dropdown loads options with an empty query and does not require a minimum input length. |

## V2 files checked

- `src/features/catalog/components/catalog-universos-tab.tsx`
- `src/features/catalog/types/catalog-relations.ts`
- `src/features/catalog/components/catalog-lookup-select.tsx`
- `src/components/ui/lookup-select.tsx`
- `src/features/banners/components/banner-form-page.tsx`
- `app/api/banners/[id]/universos/route.ts`
- `src/features/catalog/components/catalog-universos-tab.test.ts`
- `docs/17-modulo-banners.md`

## Result

No code migration was needed in this batch. The functional parity from both legacy commits is already present in the current v2 implementation and covered by the existing catalog universe tests from the earlier `components` batch.
