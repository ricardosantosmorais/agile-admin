# Evidence: branch, worktree and lost-object recovery

Date: 2026-05-18

## Git refs checked

`master`, `origin/master` and `codex/catalogos-digitais-studio-slice` were all at `c6bc0c0` before the recovery commit.

Local branches not merged into `master`:

- `codex/amplify-build-output-size` at `8fc4940`: patch already exists in `master` as an equivalent change; no merge needed.
- `codex/fix-multiaba-tenant-context` at `1b6b8d2`: equivalent change exists in `master` as `1d1c536`; no merge needed.
- `codex/conteudo-arquivos-migracao` at `a0bd20e`: contains dashboard analytics commits not reachable by hash from `master`, but cherry-pick review showed the current `master` already has a newer `dashboardRoot.rootV2` analytics implementation with daily comparison, rankings, decline signals and tooltips. The cherry-pick was aborted to avoid replacing the newer dashboard with the older branch version.

## Worktrees checked

Registered detached worktrees:

- `C:/Users/ricar/.codex/worktrees/0525/admin-v2-web` at `d4ad7c5`
- `C:/Users/ricar/.codex/worktrees/a14f/admin-v2-web` at `d4ad7c5`
- `C:/Users/ricar/.codex/worktrees/df6c/admin-v2-web` at `d4ad7c5`
- `C:/Users/ricar/.codex/worktrees/1a46/admin-v2-web` at `b29a91c`
- `C:/Users/ricar/.codex/worktrees/42fc/admin-v2-web` at `b29a91c`
- `C:/Users/ricar/.codex/worktrees/98e5/admin-v2-web` at `b29a91c`
- `C:/Users/ricar/.codex/worktrees/a8e8/admin-v2-web` at `b29a91c`
- `C:/Users/ricar/.codex/worktrees/e9e0/admin-v2-web` at `db3f138`

All listed detached heads were already contained in `master` or had `master` as merge-base, so they did not carry additional commits to merge.

## Cherry-pick review

Attempted commits from `codex/conteudo-arquivos-migracao`:

- `71177ee feat(dashboard-root): adiciona bloco analytics com faturamento, rankings e sinais de queda`
- `ea40af6 refactor(dashboard-root): remove kpi de taxa de erro de sincronizacao`

Disposition:

- not merged as-is;
- the first commit conflicted with newer `master` files in dashboard component, hook, mapper, formatter, types and i18n;
- the current `master` version already exposes the analytics concepts from that branch in a newer shape;
- keeping the old branch patch would risk regressing the dashboard root UI and data contract.

## Lost blob recovered

`git fsck --no-reflogs --unreachable` exposed blob `8b153d4a64a57e018de6b85ed5f7edf160d94e22`, containing a previous `catalogos-digitais-list-page.tsx` implementation with row actions and bulk delete. The current recovery reimplemented those behaviors against the latest v2 list, shared warning component, bridge and tests.
