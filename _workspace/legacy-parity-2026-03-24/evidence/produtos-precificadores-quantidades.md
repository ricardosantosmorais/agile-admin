# produtos-precificadores/quantidades

Legacy commits checked:

- `65af09b5e` - Ajuste de nomenclatura e máscara em Produtos x Precificadores

## Legacy change

- `components/produtos-precificadores-wizard-form.php`
  - renames `itens_pedido_de` from `Quantidade Mínima de Itens` to `Quantidade Mínima de Itens no Pedido`.
  - renames `itens_pedido_ate` from `Quantidade Máxima de Itens` to `Quantidade Máxima de Itens no Pedido`.
  - changes `pedido_minimo` and `pedido_maximo` from order-value labels with `R$` prefix to item-quantity labels.
- `assets/js/components/produtos-precificadores-wizard-form.js`
  - applies decimal masks to `pedido_minimo` and `pedido_maximo`.
  - updates the review step to show these fields as quantities, not money.
- `boot.php`
  - asset-version bump only.

## V2 comparison

- The v2 wizard already had the operational fields and persisted them through the `produtos_precificadores` bridge.
- Missing parity was visual/semantic:
  - `pedido_minimo` and `pedido_maximo` still appeared as monetary fields with `R$`.
  - the review step formatted them as currency.
  - `itens_pedido_de` and `itens_pedido_ate` used generic "Itens por pedido" labels.

## Migration applied

- Updated the v2 wizard labels to match the corrected legacy semantics.
- Removed the `R$` affix from `pedido_minimo` and `pedido_maximo`.
- Switched those inputs to decimal quantity masking.
- Updated the review summary to format those fields as localized decimals instead of currency.
- Added PT/EN i18n keys for the new labels.
- Updated mapper coverage to assert decimal quantity payloads for `pedido_minimo` and `pedido_maximo`.

## Validation

- `.\npxw.cmd vitest run src/features/produtos-precificadores/services/produtos-precificadores-mappers.test.ts`
- `.\npmw.cmd run typecheck`
- `.\npmw.cmd run lint`
