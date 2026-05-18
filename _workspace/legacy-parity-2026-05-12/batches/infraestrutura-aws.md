# Batch: infraestrutura-aws

Initial priority: 6
Initial disposition: likely-new-surface

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-11 | 724430159 | Adicionar paineis AWS de infraestrutura |
| 2026-05-11 | 9ba5cd69b | Permitir assume role nos paineis AWS |
| 2026-05-12 | 028d225ad | Corrigir credencial de assume role AWS |
| 2026-05-12 | f0d8f3b0a | Corrigir exibicao do ASG no painel de saude |
| 2026-05-12 | 3fd566a9f | Show RDS disk allocation in infra health |
| 2026-05-12 | 9fd01419d | Compact RDS storage columns |
| 2026-05-12 | 8e6566514 | Refine infra storage display |
| 2026-05-12 | f8226e926 | Add EB log archive fallback |
| 2026-05-12 | c1efd26f6 | Increase EB log retrieval polling |
| 2026-05-12 | 8fb8e0138 | Merge pull request #732 from agileecommerce/fix/root-fixes |

## Main legacy files

- `components/infraestrutura-financeiro-aws.php`
- `components/infraestrutura-saude-plataforma.php`
- `controllers/infraestrutura-financeiro-aws-controller.php`
- `controllers/infraestrutura-saude-plataforma-controller.php`
- `assets/js/components/infraestrutura-financeiro-aws.js`
- `assets/js/components/infraestrutura-saude-plataforma.js`
- `includes/aws-platform-monitor/*`
- `scripts/sql/2026-05-11-infraestrutura-aws-dashboard.sql`
- `.ebextensions/google-chrome.config`

## Questions to answer before migration

- Does v2 need an equivalent AWS infrastructure dashboard now?
- Which backend should own AWS credentials, assume-role and log retrieval?
- Can this safely live in frontend bridges, or should it stay backend-only?
- Is the feature internal/master-only and tenant-independent?

## Initial recommendation

Do not implement immediately as a simple screen copy. This is a new operational/infrastructure surface with security and credential implications. First map backend ownership and product access rules.
