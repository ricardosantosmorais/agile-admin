# Batch: .gitignore

## Legacy commit checked

- `9b9dc314e` - `chore: ignorar log local do admin`
  - Legacy file: `.gitignore`
  - Legacy change: adds `tmp/admin-local.log` to ignore a local admin log file.

## V2 comparison

- V2 file checked: `.gitignore`
- V2 already ignores:
  - `*.log`
  - `npm-debug.log*`
  - `yarn-debug.log*`
  - `yarn-error.log*`
  - `pnpm-debug.log*`
  - `lerna-debug.log*`

## Decision

- Already covered by v2.
- The legacy-specific `tmp/admin-local.log` pattern is covered by the broader `*.log` rule in `admin-v2-web`.

## Result

- No `.gitignore` change required.
- Batch marked as completed in the parity inventory.
