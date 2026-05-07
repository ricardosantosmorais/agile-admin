# Evidence: includes

Legacy commit checked:

- `5003de21a` - `Traduz regras amigaveis de rastreabilidade`

Legacy surface:

- `includes/helpers.php`
- `getOriginTraceRuleCatalog()`
- `getOriginTraceFieldCatalog()`
- `getOriginTraceSourceCatalog()`
- `renderOriginTraceSummaryHtml()`

V2 migration:

- `src/features/pedidos/services/pedidos-mappers.ts`
  - Added the friendly origin-trace rule, field and source catalogs.
  - Normalizes `metadata.origin_trace` payloads and generates summary rows for master product technical artifacts.
- `src/features/pedidos/components/pedido-detail-page.tsx`
  - Shows the friendly summary table above the raw JSON in the product technical log modal.
- `src/i18n/dictionaries/pt-BR.ts`
- `src/i18n/dictionaries/en-US.ts`
  - Added modal/table labels.
- `docs/32-modulo-pedidos.md`
  - Documents the product trace summary as part of the current Orders scope.

Validation:

- `.\npxw.cmd vitest run src/features/pedidos/services/pedidos-mappers.test.ts`
