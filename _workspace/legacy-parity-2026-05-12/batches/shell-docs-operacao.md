# Batch: shell-docs-operacao

Initial priority: 7
Initial disposition: mostly-applicability-check

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-06 | d632a7169 | Aumenta sessao do admin para oito horas |
| 2026-05-09 | 5cacea1e2 | Instala Chrome no EB para PDF dos catálogos |
| 2026-05-11 | f4ec2f402 | Ajuste de boot |
| 2026-05-12 | 6c803ff85 | Fix admin route scroll reset |
| 2026-05-12 | a7fa4c247 | Merge pull request #733 from agileecommerce/fix/configuracoes-pedidos-mensagem |

## Main legacy files

- `.ebextensions/project.config`
- `.ebextensions/google-chrome.config`
- `boot.php`
- `assets/js/scripts.js`
- `docs/*`

## Questions to answer before migration

- Is the 8-hour session change applicable to v2 session lifecycle?
- Is route scroll reset already handled by Next.js/App Router shell behavior?
- Is Chrome installation relevant only to legacy EB/PDF generation?
- Do docs/boot changes require v2 docs updates or no product migration?

## Initial recommendation

Review last, after product batches. Most items are likely already covered by v2 architecture or belong to backend/deploy infrastructure, but session lifecycle deserves a direct check against v2 rules.
