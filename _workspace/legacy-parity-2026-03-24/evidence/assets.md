# Evidence: assets

Batch: `assets`
Legacy date range: 2026-03-31..2026-05-03

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `884cd76a2` | Reinitialized legacy header quick search after the tenant header/menu bootstrap and recollected menu data after menu refreshes. | No production migration. The v2 quick access is already derived from React state in `Topbar`, using `getMenuItems()` and `flattenMenuItems()`, so it recomputes from the current session/menu instead of scraping a loaded DOM menu. |
| `b5d699679` | Reloaded the legacy PHP panel with a `cachebust` query parameter when `ASSETS_VERSION` mismatch was detected. | No production migration. The v2 does not use `boot.php`/`ASSETS_VERSION`; static asset versioning belongs to the Next.js build/runtime pipeline. |

## V2 surface checked

- `src/components/shell/topbar.tsx`
- `src/components/navigation/menu-items.ts`

## Conclusion

No production migration was made in this batch by product decision. The quick access behavior is already covered by the v2 shell architecture, and the stale asset reload mechanism is legacy-only.
