# Evidence: Catálogos Digitais list actions

Date: 2026-05-18

## Legacy baseline

Legacy files checked:

- `C:\Projetos\admin\components\catalogos-studio.php`
- `C:\Projetos\admin\assets\js\components\catalogos-studio.js`
- `C:\Projetos\admin\controllers\catalogos-studio-controller.php`

Legacy row actions are rendered by `tableActions(catalog)` in `assets/js/components/catalogos-studio.js`:

- `preview-catalog`: Prévia, always rendered.
- `copy-catalog`: Copiar, rendered when `can("criar")`.
- `edit-catalog`: Alterar, rendered when `can("editar")`.
- `delete-catalog`: Excluir, rendered when `can("deletar")`.

The list also has checkbox selection and the bulk delete button `cs-btn-delete-selected`, shown only when delete permission exists and at least one row is selected.

## State before recovery

Current tracked branches/worktrees checked during this pass expose only the row edit action in `src/features/catalogos-digitais/components/catalogos-digitais-list-page.tsx`.

Branches checked:

- `master`
- `origin/master`
- `codex/legacy-parity-2026-05-12`
- `origin/codex/legacy-parity-2026-05-12`
- `codex/catalogos-digitais-studio-slice`

Registered worktrees checked:

- `C:/Projetos/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/0525/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/1a46/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/42fc/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/98e5/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/a14f/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/a8e8/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/df6c/admin-v2-web`
- `C:/Users/ricar/.codex/worktrees/e9e0/admin-v2-web`

No active branch/worktree listed above currently preserves the full action set.

## Lost Git object found

`git fsck --no-reflogs --unreachable` found an unreachable blob with a previous v2 list implementation:

- blob: `8b153d4a64a57e018de6b85ed5f7edf160d94e22`
- file shape: `src/features/catalogos-digitais/components/catalogos-digitais-list-page.tsx`
- imports included `Copy`, `Eye`, `Pencil`, `Plus`, `RefreshCcw` and `Trash2`.

Relevant recovered behavior from the blob:

- row action `preview` with `Eye`, label `digitalCatalogs.previewCatalog`, calling `previewCatalog`;
- row action `copy` with `Copy`, label `digitalCatalogs.copyCatalog`, calling `duplicateCatalog`;
- row action `edit` with `Pencil`, href `/catalogos-digitais/[id]/editar`;
- row action `delete` with `Trash2`, label `digitalCatalogs.deleteCatalog`, opening a delete confirmation;
- selected IDs state for checkbox/bulk behavior;
- bulk action `digitalCatalogs.deleteSelected`;
- confirmation dialog with single/multiple delete descriptions;
- `item.publicUrl` rendered as an external link in the name column.

This indicates the action work likely existed locally but is no longer referenced by an active branch/worktree. Treat this blob as recovery evidence for the next implementation slice, but revalidate it against the current list page, shared `ModuleContractWarning`, client contracts and tests before applying.

## Recovery applied

Applied on 2026-05-18 in `codex/catalogos-digitais-studio-slice`:

- restored row actions `Prévia/Visualizar`, `Copiar`, `Editar` and `Excluir`;
- restored checkbox selection and bulk delete;
- added confirmation modal for row/bulk delete;
- added v2 client/API bridge delete path with tenant-aware payload;
- kept the current shared contract warning and v2 table patterns instead of copying the lost blob literally;
- added tests for component actions and API delete payload.

Remaining list gaps:

- complete visual validation in PT/EN, desktop/mobile, light/dark.

Follow-up applied on 2026-05-18:

- `Copiar` is visible by the same legacy `can("criar")` rule, with the module-contract guard kept inside the action.
- The catalog name only renders as an external public link when `url_publica`, `publicado` and `status === "pronto"` are all true, matching the legacy DataTable renderer.
- `Prévia/Visualizar` now uses the same public-link condition; without it, the UI opens the v2 HTML preview bridge instead of opening a non-public URL.

HTML preview bridge applied on 2026-05-18:

- Legacy comparison confirmed that list `preview-catalog` runs `loadCatalogForOutput(id, openPreviewTab)`, then `openPreviewTab` calls controller action `previewHtml` with the current snapshot payload.
- v2 now exposes `GET /api/catalogos-digitais/[id]/preview-html`, fetches the tenant-scoped detail with `embed=produtos`, and renders HTML from the saved snapshot.
- The list action opens the public URL only when `url_publica`, `publicado` and `status === "pronto"` match; otherwise it opens the v2 HTML preview bridge for the saved catalog snapshot.
