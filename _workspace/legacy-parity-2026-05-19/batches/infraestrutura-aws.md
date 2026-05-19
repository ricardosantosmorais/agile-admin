# Batch: infraestrutura-aws

Title: Infraestrutura AWS: Saude da Plataforma e Financeiro AWS
Disposition: depende-backend-contrato
Priority: P2
Commit count: 25

## Summary

Grande volume de ajustes de EC2/RDS/Redis/EB/ALB/WAF/custos/graficos/refresh. Manter como dependencia de contrato `api-v3`.

## Current reading

- Recommendation: Nao iniciar no frontend agora.
- Rationale: A superficie v2 foi preparada na fase anterior, mas execucao real exige endpoints server-side fora do front.
- Handoff evidence: v2 routes/surfaces are partial, but live AWS collection is deferred until server-side endpoints exist.
- Expected work is backend/API contract first; frontend-only migration would either duplicate sensitive AWS behavior or create fake functionality.

## API-v3 recheck 2026-05-19

Verdict: backend is partially contemplated, but not enough to mark this batch as ready for v2 UI migration.

- `status-plataforma` tenant health is covered by api-v3 through `GET /status/tenant-health` and `GET /status/tenant-health/incidents`.
- `Financeiro AWS` has live backend collection logic in `App\Support\AwsFinancialLiveSnapshot`, including costs, commitments, reservation coverage, service breakdown, invoices and alerts.
- That financial logic is currently used by the console/e-mail path `infra:financeiro-aws:email`; no HTTP route/controller was found exposing it to the admin v2.
- `Saude da Plataforma` AWS global dashboard is not covered by the same tenant health service. The tenant health service checks tenant-facing blocks such as DNS, loja, API, banco, cache, painel, integracoes and notificacoes.
- No api-v3 HTTP/API surface was found for the legacy health actions `snapshot`, `accounts`, `compute`, `rds`, `redis`, `metric_series`, `alerts`, `waf_ip_sets`, `save_waf_ip_sets` or `download_eb_logs`.
- No api-v3 usage was found for the AWS clients needed by the legacy health surface such as Elastic Beanstalk logs, WAF v2 writes or CloudWatch metric series. The current api-v3 AWS client usage is concentrated in the financial snapshot collector.

Updated split:

| Surface | Backend status | V2 implication |
|---|---|---|
| Status da Plataforma tenant | Covered by api-v3 | Already migrated/usable through shell status bridge. |
| Financeiro AWS | Backend collector exists, HTTP contract missing | Do not migrate now, because this would require exposing api-v3 HTTP contract. |
| Saude AWS global | Not covered by api-v3 contract found | Legacy PHP-only for now; skip this phase. |
| WAF IP sets | Not covered by api-v3 contract found | Legacy PHP-only for now; skip this phase. |
| EB log download | Not covered by api-v3 contract found | Legacy PHP-only for now; skip this phase. |

## Decision 2026-05-19

Do not change `api-v3` in this parity phase.

Even where api-v3 already has reusable internals, such as `AwsFinancialLiveSnapshot`, the v2 still has no consumable HTTP contract today. Creating that contract would be backend work, and the current instruction is to avoid touching v3 for now.

Therefore:

- `Financeiro AWS` stays explicitly deferred until api-v3 exposes a supported read-only HTTP contract.
- `Saude AWS global`, WAF IP sets and EB log download stay explicitly deferred because the working implementation is still direct PHP in the legacy admin.
- This batch must not block the next parity step.
- Next parity work should move to the next small v2-owned backlog item: `configuracoes-pedidos-carrinho`.

Evidence file: `../evidence/api-v3-infraestrutura-aws.md`.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-12 | `0c5f152aa` | Ajusta leitura de evictions no painel de saúde | depende-backend-contrato | 4 |
| 2026-05-12 | `6cb86acbd` | Corrigir cobertura EC2 com Savings Plans | depende-backend-contrato | 2 |
| 2026-05-12 | `b92cf4285` | Ajusta alerta de storage RDS com autoscale | depende-backend-contrato | 3 |
| 2026-05-13 | `02a6c2587` | Adiciona status Elastic Beanstalk na saude AWS | depende-backend-contrato | 6 |
| 2026-05-13 | `0e0b3d746` | Ajusta cobertura e ordenacao do painel AWS | depende-backend-contrato | 9 |
| 2026-05-13 | `2d3cfcd58` | Ajusta rotulo N8N no Redis AWS | depende-backend-contrato | 2 |
| 2026-05-13 | `4080d7759` | Ajusta ordenacao dos paineis AWS | depende-backend-contrato | 7 |
| 2026-05-13 | `50f84971a` | Simplifica Redis no painel de saude AWS | depende-backend-contrato | 3 |
| 2026-05-13 | `53674504d` | Remove icone dos links de metricas AWS | depende-backend-contrato | 1 |
| 2026-05-13 | `557cdeeba` | Ajusta tabela Elastic Beanstalk | depende-backend-contrato | 3 |
| 2026-05-13 | `5a1efc728` | Prioriza faturas vencidas no painel AWS | depende-backend-contrato | 2 |
| 2026-05-13 | `5b23f9eab` | Incrementa versao de assets do painel AWS | depende-backend-contrato | 1 |
| 2026-05-13 | `62ffa28b1` | Exibe papel e tipo nos recursos AWS | depende-backend-contrato | 6 |
| 2026-05-13 | `63e343b96` | Reduz janela de evictions Redis | depende-backend-contrato | 6 |
| 2026-05-13 | `721794583` | Adiciona refresh por bloco no financeiro AWS | depende-backend-contrato | 3 |
| 2026-05-13 | `7a4f6a117` | Exibe variacao no mes atual AWS | depende-backend-contrato | 3 |
| 2026-05-13 | `8148b41e6` | Corrige ordenacao de faturas AWS por status | depende-backend-contrato | 2 |
| 2026-05-13 | `81ade9fd0` | Adiciona graficos de metricas AWS | depende-backend-contrato | 7 |
| 2026-05-13 | `903792726` | Adiciona refresh por bloco na saude AWS | depende-backend-contrato | 3 |
| 2026-05-13 | `f384059da` | Ajusta prioridade de ordenacao Redis AWS | depende-backend-contrato | 4 |
| 2026-05-13 | `f42944729` | Ajusta granularidade dos graficos AWS | depende-backend-contrato | 2 |
| 2026-05-13 | `f7880d171` | Ajusta painel AWS financeiro e saude | depende-backend-contrato | 8 |
| 2026-05-13 | `f8c26ee8b` | Adiciona novas conexoes no Redis AWS | depende-backend-contrato | 7 |
| 2026-05-13 | `ff2888db0` | Aprimora metricas de conexao Redis AWS | depende-backend-contrato | 8 |
| 2026-05-14 | `0fc060f23` | Ajusta severidade de latencia ALB | depende-backend-contrato | 2 |

## Legacy files touched

- `assets/js/components/infraestrutura-financeiro-aws.js`
- `assets/js/components/infraestrutura-saude-plataforma.js`
- `boot.php`
- `components/infraestrutura-financeiro-aws.php`
- `components/infraestrutura-saude-plataforma.php`
- `controllers/infraestrutura-saude-plataforma-controller.php`
- `includes/aws-platform-monitor/live.php`
- `includes/aws-platform-monitor/snapshot.php`
- `includes/aws-platform-monitor/sort.php`
- `includes/header.php`
- `tests/aws-ec2-size-flex-reservation.test.php`
- `tests/aws-platform-health-compute-alerts.test.php`
- `tests/aws-platform-live-invoices.test.php`
- `tests/aws-platform-metric-series.test.php`
- `tests/aws-platform-row-sort.test.php`
- `tests/aws-rds-storage-status.test.php`
