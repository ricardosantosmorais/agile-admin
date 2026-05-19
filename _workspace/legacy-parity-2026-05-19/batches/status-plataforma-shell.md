# Batch: status-plataforma-shell

Title: Shell: status da plataforma, micro status e troca de tenant
Disposition: ja-migrado
Priority: P3
Commit count: 52

## Summary

Commits de status tenant, monitoramento parcial, micro status, coracao/topbar e troca de empresa.

## Current reading

- Recommendation: Sem nova fatia.
- Rationale: Handoff anterior registra a migracao no topbar, rota `/status-plataforma` e bridge `/api/shell/platform-status`.
- Handoff evidence: `/api/shell/platform-status`, topbar popover and `/status-plataforma` were migrated in the previous phase.
- Keep as already migrated unless a fresh regression is found in v2.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-12 | `06ce364f5` | Revisa consistencia das mensagens do status | ja-migrado | 3 |
| 2026-05-12 | `221e9e1a5` | Exibe status da plataforma para validação | ja-migrado | 5 |
| 2026-05-12 | `2e4f3fbc4` | Troca icone por indicador online no status | ja-migrado | 2 |
| 2026-05-12 | `3f88999c6` | Evita grave falso quando monitor v2 indisponivel | ja-migrado | 1 |
| 2026-05-12 | `551915206` | Ajusta pluralizacao de servicos no status | ja-migrado | 2 |
| 2026-05-12 | `77fd0336e` | Adiciona status da plataforma para tenant | ja-migrado | 9 |
| 2026-05-12 | `7b580d96f` | Ajusta N/D no status geral da plataforma | ja-migrado | 2 |
| 2026-05-12 | `8ffa19980` | Ajusta pluralizacao dos textos de status | ja-migrado | 2 |
| 2026-05-12 | `aa66dabb0` | Remove subtitulo do status da plataforma | ja-migrado | 1 |
| 2026-05-12 | `d7b6606eb` | Ajusta exibicao de monitoramento parcial | ja-migrado | 3 |
| 2026-05-13 | `003c02d23` | Documenta fallback DNS do status da plataforma | ja-migrado | 1 |
| 2026-05-13 | `012cb01c7` | Atualiza status da plataforma do tenant | ja-migrado | 6 |
| 2026-05-13 | `05c83006f` | Corrige troca de empresa no status da plataforma | ja-migrado | 2 |
| 2026-05-13 | `0d79d4547` | Documenta prioridade de incidentes ativos | ja-migrado | 1 |
| 2026-05-13 | `150b97b84` | Ajusta micro status da plataforma | ja-migrado | 4 |
| 2026-05-13 | `19d8be82a` | Documenta monitor apenas em producao | ja-migrado | 1 |
| 2026-05-13 | `2ad3a1498` | Corrige refresh do status no topo | ja-migrado | 2 |
| 2026-05-13 | `2d7796606` | Corrige troca de empresa pelo seletor do admin | ja-migrado | 3 |
| 2026-05-13 | `343d99b8c` | Documenta configuracao curta de integracoes do status | ja-migrado | 1 |
| 2026-05-13 | `38111c0e6` | Detalha recheck de incidentes ativos | ja-migrado | 1 |
| 2026-05-13 | `50c2d11d2` | Corrige rota do status da plataforma na api v3 | ja-migrado | 2 |
| 2026-05-13 | `57c425d4f` | Atualiza plano do status da plataforma | ja-migrado | 1 |
| 2026-05-13 | `5a59ad2f7` | Revert "Ajusta status da plataforma por tenant" | ja-migrado | 6 |
| 2026-05-13 | `61764117f` | Ajusta status da plataforma por tenant | ja-migrado | 6 |
| 2026-05-13 | `6c1091c8e` | Corrige atualizacao do status da plataforma no topo | ja-migrado | 2 |
| 2026-05-13 | `71ad943e5` | Corrige contexto do status da plataforma | ja-migrado | 5 |
| 2026-05-13 | `76474ac64` | Corrige evento do seletor de empresa | ja-migrado | 2 |
| 2026-05-13 | `8f48b48ee` | Ajusta carregamento inicial do micro status | ja-migrado | 1 |
| 2026-05-13 | `adc53043f` | Aprimora paineis de saude da plataforma | ja-migrado | 7 |
| 2026-05-13 | `ca25892f1` | Corrige corrida na troca de empresa do admin | ja-migrado | 2 |
| 2026-05-13 | `d9dbe84bd` | Ajusta status de processamentos no topo | ja-migrado | 2 |
| 2026-05-13 | `eb482432b` | Ajusta status da plataforma no topo e DNS | ja-migrado | 5 |
| 2026-05-13 | `eb874b2e4` | Ajusta status da plataforma por tenant | ja-migrado | 5 |
| 2026-05-13 | `f6f48e2ac` | Corrige refresh do status da plataforma | ja-migrado | 6 |
| 2026-05-14 | `17df06b0a` | Sincroniza coracao do status da plataforma | ja-migrado | 4 |
| 2026-05-14 | `3e4c80665` | Corrige contexto do status da plataforma | ja-migrado | 5 |
| 2026-05-14 | `3ecdf1a16` | Remove atalho legado do coracao da plataforma | ja-migrado | 3 |
| 2026-05-14 | `4c6edd7a5` | Sincroniza atualizacao do status da plataforma | ja-migrado | 3 |
| 2026-05-14 | `5aa124d7b` | Estabiliza coração do status da plataforma | ja-migrado | 3 |
| 2026-05-14 | `706d02027` | Ajusta frequencia do status da plataforma | ja-migrado | 4 |
| 2026-05-14 | `71e80cbb7` | Estabiliza navegacao do coracao da plataforma | ja-migrado | 3 |
| 2026-05-14 | `8c600e1b0` | Estabiliza micro status da plataforma | ja-migrado | 2 |
| 2026-05-14 | `924ad1336` | Corrige troca de tenant no status da plataforma | ja-migrado | 2 |
| 2026-05-14 | `99eba2712` | Estabiliza micro status da plataforma | ja-migrado | 3 |
| 2026-05-14 | `9b05fa675` | Consulta status da plataforma sob demanda | ja-migrado | 4 |
| 2026-05-14 | `9f1e0f4ce` | Garante navegacao do coracao da plataforma | ja-migrado | 2 |
| 2026-05-14 | `c047f6285` | Reforca clique do coracao da plataforma | ja-migrado | 2 |
| 2026-05-14 | `c2c206b5b` | Ajusta status pendente da integracao no monitor | ja-migrado | 4 |
| 2026-05-14 | `d32d2af72` | Torna status da plataforma assincrono | ja-migrado | 5 |
| 2026-05-14 | `d62e770dd` | Liberar status da plataforma para usuarios do admin | ja-migrado | 7 |
| 2026-05-14 | `fd2fafc08` | Corrige refresh do micro status da plataforma | ja-migrado | 2 |
| 2026-05-15 | `795d17719` | Ajusta leitura do status de integração | ja-migrado | 4 |

## Legacy files touched

- `assets/js/components/status-plataforma.js`
- `assets/js/scripts.js`
- `boot.php`
- `components/status-plataforma.php`
- `controllers/servicos-integracao-controller.php`
- `controllers/status-plataforma-controller.php`
- `docs/projetos/README.md`
- `docs/projetos/status-plataforma/regras-monitoramento-tenant.md`
- `docs/superpowers/plans/2026-05-11-dashboard-infraestrutura-aws.md`
- `docs/superpowers/plans/2026-05-12-status-plataforma-tenant-health.md`
- `includes/aws-platform-monitor/live.php`
- `includes/header.php`
- `includes/menu.php`
- `includes/status-plataforma-monitor.php`
- `tests/aws-platform-health-compute-alerts.test.php`
- `tests/status-platform-async.test.js`
