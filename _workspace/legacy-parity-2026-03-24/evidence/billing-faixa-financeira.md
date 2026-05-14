# billing/faixa-financeira

Legacy commits checked:

- `2f5901daa` - Ajusta estilo do modal de pendencias

## Decision

- No production migration was applied to v2 in this batch.
- The legacy commit only changes inline visual style in `controllers/billing-upgrade-controller.php`:
  - modal text color from `#111111` to `#4a4b6a`;
  - modal font size from `1.2rem` to `1rem`;
  - same adjustment for the financial-pending modal and the billing-upgrade modal HTML.
- The underlying surface is the legacy billing/financial-pending banner and modal flow, already tracked as deferred because v2 currently has no equivalent billing-upgrade shell surface, API contract or product decision for this flow.

## Tracking

- Added `2f5901daa` to the existing deferred billing/financial-pending item in `_workspace/legacy-parity-2026-03-24/deferred.md`.
- This is not considered forgotten; it should reopen together with the broader v2 billing/financial-pending shell feature.
