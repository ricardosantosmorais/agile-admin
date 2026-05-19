# Batch: asset-version-refresh-legado

Title: Legado: boot e asset version
Disposition: nao-aplicavel-v2
Priority: P4
Commit count: 5

## Summary

Commits de boot, versionamento de assets e remocao de auto-refresh do asset-version no admin legado.

## Current reading

- Recommendation: Nao migrar.
- Rationale: O v2 nao usa `boot.php`, `ASSETS_VERSION` nem o refresh legado removido.
- Legacy `boot.php` and asset-version refresh do not exist in the v2 architecture.
- Do not touch legacy `boot.php`; it is dirty locally and out of scope.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-12 | `92bf674c7` | Ajuste de boot | nao-aplicavel-v2 | 1 |
| 2026-05-12 | `9514dc994` | Incrementa versão de assets do admin | nao-aplicavel-v2 | 1 |
| 2026-05-13 | `1a6c6063d` | Remove asset version auto refresh again | nao-aplicavel-v2 | 3 |
| 2026-05-13 | `c83e6ba5f` | Merge pull request #737 from agileecommerce/codex/remove-asset-version-refresh-again | nao-aplicavel-v2 | 0 |
| 2026-05-14 | `a96b60bbc` | boot | nao-aplicavel-v2 | 1 |

## Legacy files touched

- `assets/js/scripts.js`
- `boot.php`
- `tests/asset-version-refresh.test.js`
