# condicoes-pagamento

Legacy commits checked:

- `efa16a524` - Corrige listagem e edição de restrições em condições de pagamento e atualiza badge ativo
- `55ca91489` - feat: implementa editor de exceções para condições de pagamento
- `00f51db6c` - fix: restaura aba de Restrições no formulário de condições de pagamento
- `d2bf170aa` - Implementa CRUD de exceções e proteção de registros sincronizados
- `df6eb3df6` - feat: ajustes no formulário de condições de pagamento

## Current v2 coverage found

- The v2 already had the `Condições de pagamento` list, general form, and `Filiais` relation tab.
- The v2 did not yet expose the legacy `Restrições` and `Exceções` tabs for payment terms.
- `Formas de pagamento` already had a similar occurrence-tab pattern, but its occurrence list and API contract differ from `condicoes_pagamento`.

## Migrated in this batch

- Added `Restrições` and `Exceções` tabs to the payment term edit form.
- Added dedicated payment-term occurrence mappers with the legacy scopes for restrictions and exceptions.
- Added API bridges for:
  - `/api/condicoes-de-pagamento/[id]/restricoes`
  - `/api/condicoes-de-pagamento/[id]/excecoes`
- Preserved the legacy `id_sync` protection by blocking edit/delete of synchronized restriction/exception records in the bridge and disabling row actions in the UI.
- Added `ativo`, date range, lookup, taxpayer, customer type, state, and all-scope handling in the v2 modal.
- Updated PT/EN i18n, the financial module docs, and the existing Condições de pagamento E2E to open the relation tabs.

## Coverage and validation

- `src/features/condicoes-pagamento/services/condicoes-pagamento-mappers.test.ts`
- `app/api/condicoes-de-pagamento/[id]/restricoes/route.test.ts`
- `npxw.cmd vitest run src/features/condicoes-pagamento/services/condicoes-pagamento-mappers.test.ts app/api/condicoes-de-pagamento/[id]/restricoes/route.test.ts`
- `npxw.cmd eslint src/features/condicoes-pagamento app/api/condicoes-de-pagamento/[id]/restricoes/route.test.ts app/api/condicoes-de-pagamento/[id]/_occurrences-route.ts app/api/condicoes-de-pagamento/[id]/restricoes/route.ts app/api/condicoes-de-pagamento/[id]/excecoes/route.ts`
- `npmw.cmd run typecheck`
- `npmw.cmd run lint`
- `npmw.cmd run build`

## Validation note

- `npmw.cmd test` was also executed. The new Condições de pagamento tests passed, but the full suite still has an unrelated existing failure in `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`: the test expects `script: null` in `buildAcaoPayload`, while the current payload omits `script`.
