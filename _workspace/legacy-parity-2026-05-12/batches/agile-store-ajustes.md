# Batch: agile-store-ajustes

Initial priority: 2
Initial disposition: analyze-after-current-ui

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-08 | d1dd9058a | Ajusta catalogos digitais e loja de apps |
| 2026-05-08 | cf3cd5b63 | Ajusta poster dos videos da Agile Store |
| 2026-05-09 | 0b201da39 | Atualiza materiais da Agile Store |
| 2026-05-09 | 7e6973838 | Ajusta beneficios da loja de aplicativos |
| 2026-05-09 | d6064eb98 | Atualiza materiais da Agile Store |
| 2026-05-11 | 73cc7f9da | Ajusta feedback da Agile Store |
| 2026-05-11 | 2088bd540 | Ajusta motivos de feedback da Agile Store |

## Main legacy files

- `assets/js/components/app-store-detail.js`
- `assets/js/components/app-store-admin.js`
- `components/app-store-detail.php`
- `components/app-store-admin.php`
- `controllers/app-store-controller.php`
- `docs/projetos/app-store/README.md`
- `assets/app-store/sac/*`
- `assets/app-store/catalogos-digitais/*`

## Current v2 context

The v2 Agile Store public list/detail, SAC admin slices, admin backoffice and attachment flow were migrated in the previous phase. The active branch already adjusted the UI/loading/detail behavior and was merged to `master`.

## Questions to answer before migration

- Did the legacy feedback/motivos change add API contract fields that v2 does not render yet?
- Are poster/material updates returned by API v3, or are they legacy static files?
- Are benefits and media for Catálogos Digitais now part of the Agile Store catalog payload?
- Does the v2 admin backoffice need additional feedback columns/actions?

## Initial recommendation

Treat this as a focused parity check after the current Agile Store UI merge. Do not rework the whole screen again; compare payload/mappers and add only missing feedback/material fields or tests.
