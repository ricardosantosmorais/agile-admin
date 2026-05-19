# Batch: relatorios-data-hora

Title: Relatorios: filtro dinamico data_hora
Disposition: ja-migrado
Priority: P3
Commit count: 2

## Summary

Ajuste de filtros `data_hora` em processos de relatorios.

## Current reading

- Recommendation: Sem nova fatia.
- Rationale: Handoff anterior registra mapper, bridge e UI com `__start`/`__end`.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-14 | `15fa22eb2` | Merge pull request #738 from agileecommerce/fix/relatorios_data_hora | ja-migrado | 0 |
| 2026-05-14 | `a5dec3a79` | ajuste de data e hora nos campos dos relatorios | ja-migrado | 3 |

## Legacy files touched

- `assets/js/components/processos-relatorios-list.js`
- `components/processos-relatorios-list.php`
- `controllers/processos-relatorios-controller.php`
