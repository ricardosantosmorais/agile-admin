# Evidence: assets

Batch: `assets`
Legacy date range: 2026-03-31..2026-05-03

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `884cd76a2` | Delayed quick-search initialization until after the legacy tenant header/menu bootstrap, then recollected DOM menu links after reloads. | No runtime migration needed. The v2 quick access is React state driven: `Topbar` derives items from `getMenuItems(session, locale)` and `flattenMenuItems(menuItems)`, so it follows the current menu data without DOM recollection. A focused test now protects the visible quick-access result. |
| `b5d699679` | Reloaded the legacy panel with `cachebust` when `ASSETS_VERSION` mismatch was detected, with a sessionStorage guard against reload loops. | Not applicable to the Next.js v2 shell. The v2 does not use the legacy `ASSETS_VERSION`/tenant bootstrap asset-mismatch flow; deployment/runtime cache invalidation belongs to the Next build and hosting layer, not this legacy panel script path. |

## V2 files checked

- `src/components/shell/topbar.tsx`
- `src/components/shell/topbar.test.tsx`
- `src/components/navigation/menu-items.ts`
- `docs/04-acesso-menu-navegacao.md`

## Result

No runtime migration was needed. Added focused coverage for the v2 quick access behavior so the legacy bootstrap timing bug does not regress into the React shell.
