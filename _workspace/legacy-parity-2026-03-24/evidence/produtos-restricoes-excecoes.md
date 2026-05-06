# Evidence: produtos/restricoes-excecoes

## Legacy commit checked

- `99060e06c`: adds weekday selection and per-day time windows to product restrictions and exceptions.

## Decision

- The v2 UI and mappers already had the main feature surface: weekday toggles, `from/to` time inputs, review summary, draft hydration and row expansion for both `restricoes-produtos` and `excecoes-produtos`.
- A small bridge parity gap was migrated: the legacy controllers accepted `HH:MM` and normalized it to `HH:MM:00`; they also nulled weekday times when the day was inactive.
- The v2 wizard routes now normalize `HH:MM` to API time format and clear inactive weekday windows before forwarding the payload.

## V2 evidence

- `src/features/restricoes-produtos/components/restricao-produto-wizard-page.tsx`: condition step renders weekday toggles and `type="time"` fields, validates paired times and shows the schedule summary.
- `src/features/excecoes-produtos/components/excecao-produto-wizard-page.tsx`: same weekday/time UI and review behavior for exceptions.
- `src/features/restricoes-produtos/services/restricoes-produtos-mappers.ts`: hydrates weekday API fields and expands draft rows with weekday/time payload fields.
- `src/features/excecoes-produtos/services/excecoes-produtos-mappers.ts`: same mapper coverage for exceptions.
- `app/api/restricoes-produtos/wizard/route.ts` and `app/api/excecoes-produtos/wizard/route.ts`: normalize bridge payloads before saving.

## Tests

- Added `app/api/restricoes-produtos/wizard/route.test.ts`.
- Added `app/api/excecoes-produtos/wizard/route.test.ts`.
- Covered `HH:MM` to `HH:MM:00` normalization for active weekdays.
- Covered clearing `*_horario_de` and `*_horario_ate` for inactive weekdays.
- Validation command: `.\npxw.cmd vitest run app\api\restricoes-produtos\wizard\route.test.ts app\api\excecoes-produtos\wizard\route.test.ts`.
