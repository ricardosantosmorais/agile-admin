# simulador-precos

Legacy commits checked:

- `f97027430` - Add freight input to price simulator
- `04635ae51` - Fix decimal freight input in price simulator
- `1efbe4b0d` - Align simulator freight input with delivery rule money pattern
- `c5ce9b0f0` - Remove custom freight validation from simulator money field
- `e7cd37f4f` - Send unmasked freight value from simulator
- `0bb0e9d95` - Serialize simulator form values on submit
- `c01e0080a` - Send simulator packaging in API-compatible format
- `629769c7f` - Normalize masked freight value before simulator submit
- `b88f9f59b` - Keep simulator freight fix scoped to freight parameter
- `7dbb9525f` - Alinha memoria de preco ao simulador
- `6ae00a8b3` - fix: corrige chamada getApiV1 inexistente para getApiV2 no simulador de precos

## Current v2 coverage found

- The v2 simulator already has the optional `valor_frete_item` field in the form draft and uses the shared `CurrencyInput` money mask.
- The bridge already calls the Agile API v2 through `agileV2Fetch`, so the legacy `getApiV1` to `getApiV2` fix is naturally covered by the v2 architecture.
- Packaging is sent as the legacy final scalar key `embalagens[id_produto]`, matching the last scoped legacy fix rather than the reverted array format.
- The simulator result already exposes product, packaging, values, order context, price rules, taxes, and quantity promotions.

## Migrated in this batch

- Added bridge normalization for simulator freight before calling API v2.
- Preserved masked Brazilian money values like `1.234,56` as API decimal `1234.56`.
- Preserved already-normalized decimal values like `12.34` instead of converting them to `1234`.
- Added route regression coverage for freight normalization and packaging scalar format.

## Coverage and validation

- `app/api/consultas/simulador-precos/route.test.ts`
- `src/features/consultas-simulador-precos/services/simulador-precos-client.test.ts`
- `npxw.cmd vitest run app/api/consultas/simulador-precos/route.test.ts src/features/consultas-simulador-precos/services/simulador-precos-client.test.ts`
- `npxw.cmd eslint app/api/consultas/simulador-precos/route.ts app/api/consultas/simulador-precos/route.test.ts src/features/consultas-simulador-precos/services/simulador-precos-client.test.ts`
- `npmw.cmd run typecheck`
- `npmw.cmd run build`
- `npmw.cmd run lint`
