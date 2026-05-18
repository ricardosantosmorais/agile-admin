# Batch: configuracoes-admin

Initial priority: 5
Initial disposition: split-by-owner

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-08 | 03c95cbea | Ajuste na formatação do Json em parâmetros |
| 2026-05-08 | f8414215f | Merge pull request #731 from agileecommerce/fix/formatar-json-parametros |
| 2026-05-11 | 178aca71c | Correções gerais base root |
| 2026-05-11 | ce6295267 | Ajuste dos campos para mitigar falha de renderização css |

## Main legacy files

- `assets/js/components/parametros-empresa-form.js`
- `assets/js/components/administradores-master-form.js`
- `assets/js/components/cadastro-servicos-form.js`
- `assets/js/components/querys-form.js`
- `assets/js/components/configuracoes-pedidos-form.js`
- `components/administradores-master-form.php`
- `components/cadastro-servicos-form.php`
- `components/querys-form.php`
- `components/configuracoes-pedidos-form.php`
- `controllers/administradores-master-controller.php`
- `controllers/cadastro-servicos-controller.php`
- `controllers/editor-sql-controller.php`

## Questions to answer before migration

- Does v2 parameter editing already format JSON safely?
- Which root/admin fixes map to current v2 modules versus legacy-only PHP screens?
- Do service/editor SQL changes overlap with parity already completed in `controllers` and `integracao-erp/servicos`?
- Are CSS-render mitigation fields actual user-facing fields in v2 configuration pages?

## Initial recommendation

Split this batch into smaller owner checks before coding:

1. Parameters JSON formatting.
2. Configurações Pedidos field/CSS mitigation.
3. Administradores/Cadastro Serviços/Editor SQL root fixes.
