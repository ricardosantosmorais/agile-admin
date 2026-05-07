# Evidence: components

Batch: `components`
Legacy date range: 2026-03-30..2026-04-23

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `97ad25fe5` | `components/apps-form.php` added default placeholder/text values for new Apps records. | Already present in v2 through `APP_DEFAULTS` and form `defaultValue` for the same login, forgot-password, alert, barcode and no-internet texts. |
| `ea7d5957c` | `components/cadastro-scripts-form.php` decoded HTML entities before selecting the current language and rendering the script in the editor. | Migrated in `integracao-com-erp-scripts`: loaded script records now decode entities before hydrating Monaco, and encoded language values such as `C&#35;` normalize to `c#`. |
| `cf9ef9638` | `components/banners-form.php` reordered banner universe types while preserving the full legacy option set. | Migrated in `CatalogUniversosTab`: the v2 now exposes the legacy order and adds `colecao`, `departamento`, `fornecedor` and `marca` universe options with lookup/payload support. |
| `3b91c4c98` | `components/integracao-logistica-form.php` hid `frenet_token_parceiro` and `frenet_nota_fiscal` from the Frenet tab. | Migrated in `integracoes-logistica`: Frenet now shows only the current token field, keeps hidden parameters in the mapper contract and defaults the hidden invoice flag to `0`. |

## V2 files changed

- `src/features/apps/services/apps-mappers.ts` checked; no code change needed.
- `src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts.ts`
- `src/features/catalog/components/catalog-universos-tab.tsx`
- `src/features/catalog/types/catalog-relations.ts`
- `src/features/banners/components/banner-form-page.tsx`
- `src/features/integracoes-logistica/components/integracao-logistica-tab-shared.tsx`
- `src/features/integracoes-logistica/services/integracao-logistica-mappers.ts`
- `src/i18n/dictionaries/pt-BR.ts`
- `src/i18n/dictionaries/en-US.ts`
- `docs/06-modulos-e-cobertura-atual.md`
- `docs/17-modulo-banners.md`

## Verification

- Red run confirmed the new script decode, banner universe, and Frenet visibility/default tests failed against the previous behavior.
- Green run: `.\npxw.cmd vitest run src\features\integracao-com-erp-scripts\services\integracao-com-erp-scripts.test.ts src\features\catalog\components\catalog-universos-tab.test.ts src\features\integracoes-logistica\components\integracao-logistica-tab-shared.test.ts src\features\integracoes-logistica\services\integracao-logistica-mappers.test.ts`
