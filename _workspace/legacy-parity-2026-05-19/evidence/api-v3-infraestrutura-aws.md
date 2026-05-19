# Evidence: api-v3 infraestrutura AWS

Date: 2026-05-19

Question: verify whether the api/back-end already covers the backend contract needed by the legacy `infraestrutura-aws` batch.

## Repos checked

- V2: `C:/Projetos/admin-v2-web`
- Backend: `C:/Projetos/api-v3`
- Legacy reference: `C:/Projetos/admin`

## Findings

### Tenant platform status is covered

`api-v3/routes/api.php` exposes:

- `GET /status/tenant-health/incidents`
- `GET /status/tenant-health`

`api-v3/app/Http/Controllers/TenantHealthController.php` authenticates the user, resolves the tenant from `empresa` or `x-id-empresa`, supports optional `service`, and delegates to `TenantHealthService`.

`api-v3/app/Services/StatusPlataforma/TenantHealthService.php` supports these tenant-facing service keys:

- `dns_resolvedor`
- `loja_online`
- `api_plataforma`
- `banco_dados`
- `cache_sessoes`
- `painel_admin`
- `integracoes`
- `notificacoes`

Conclusion: this covers the already-migrated topbar/status-plataforma tenant flow, not the full AWS operations dashboard.

### Financeiro AWS backend logic exists, but HTTP contract was not found

`api-v3/app/Support/AwsFinancialLiveSnapshot.php` has a live AWS financial collector. The returned snapshot includes:

- `summary`
- `months`
- `service_breakdown`
- `commitments`
- `reservation_coverage`
- `invoices`
- `alerts`

The class uses AWS SDK clients for Cost Explorer, EC2, RDS, ElastiCache and Savings Plans, plus AWS Invoicing request signing.

Observed usage:

- `api-v3/app/Support/AwsFinancialDailyReport.php`
- `api-v3/app/Console/Commands/SendAwsFinancialDailyEmail.php`
- unit tests around financial layout, invoice rows and EC2 size-flex coverage

No HTTP route/controller exposing this financial snapshot to admin v2 was found in `routes/api.php`.

Conclusion: `Financeiro AWS` is technically the closest infra slice because the collector exists, but it is not actionable in this phase. The v2 has no supported HTTP route to consume and the current decision is not to change api-v3.

### Saude AWS global is not covered by api-v3 contract found

Legacy health controller at `admin/controllers/infraestrutura-saude-plataforma-controller.php` supports:

- `snapshot`
- `accounts`
- `compute`
- `rds`
- `redis`
- `metric_series`
- `alerts`
- `waf_ip_sets`
- `save_waf_ip_sets`
- `download_eb_logs`

The api-v3 search did not find corresponding HTTP routes. It also did not find api-v3 usage of Elastic Beanstalk, WAF v2 or CloudWatch clients needed by those legacy flows.

Conclusion: `Saude da Plataforma` AWS global remains legacy-PHP-only for now, especially for metric series, WAF writes and EB log download.

## Decision

No api-v3 changes in this phase.

The parity backlog should treat these AWS infrastructure surfaces as deferred, not as blockers:

- If the capability only exists in direct PHP under `C:/Projetos/admin`, keep it in the legacy/admin path for now.
- If api-v3 has internal support code but no HTTP route/controller for v2, do not create the contract in this phase.
- Continue to the next v2-owned parity slice instead.

## Updated recommendation

Do not keep `infraestrutura-aws` as a single blocked lump.

Split it into:

1. `infraestrutura-financeiro-aws`: deferred until a supported api-v3 HTTP read contract already exists or v3 work is explicitly approved.
2. `infraestrutura-saude-aws`: deferred while the functional implementation remains direct PHP in the legacy admin.
3. `status-plataforma-shell`: already migrated and should remain separate from AWS global infrastructure.
