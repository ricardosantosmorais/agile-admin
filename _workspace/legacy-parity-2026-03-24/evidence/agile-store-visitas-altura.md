# agile-store/visitas-altura

Legacy commits checked:

- `371250d5d` - Limita altura das visitas da Agile Store

## Legacy change

- `components/app-store-admin.php`
  - limits the Agile Store admin visits panel to `620px`.
  - makes the visits table body scroll independently.
  - keeps table headers sticky while scrolling the visits list.

## V2 comparison

- The v2 admin backoffice already had the visits/events table and the API v3 dashboard payload.
- Missing parity was visual behavior only:
  - the visits table used the default `AppDataTable` with no vertical limit.
  - large visit lists could stretch the whole admin dashboard instead of scrolling inside the section.

## Migration applied

- Wrapped the v2 visits table in a local container that limits the desktop table shell to `620px`.
- Added vertical overflow to the table shell.
- Made the table headers sticky within that scroll container.
- Added focused component coverage to assert the constrained visits table surface remains present.

## Validation

- `.\npxw.cmd vitest run src/features/agile-store/components/agile-store-pages.test.tsx`
- The first full run timed out on the existing large admin test; the isolated rerun passed, and a second full rerun passed.
