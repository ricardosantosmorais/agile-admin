# Batch: formularios-arquivos

Initial priority: 4
Initial disposition: compare-existing-v2

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-06 | 5ce6d716c | Ajuste na visualização dos arquivos em Envios de Formulários |
| 2026-05-06 | cac60afcd | Merge pull request #729 from agileecommerce/fix/arquivos-formularios |
| 2026-05-07 | 44d079d3f | Correções de visualização de arquivo e máscara em configurações / vendedores |

## Main legacy files

- `components/formularios-envios-detalhe.php`
- `components/visualizar-arquivo.php`
- `components/informacoes-contato.php`
- `components/clientes-form.php`
- `components/configuracoes-vendedores-form.php`

## Current v2 context

The previous phase already migrated form submission contact fallback, customer/contact search parity and export metadata. This new batch looks narrower and may be partially covered.

## Questions to answer before migration

- Does v2 preview/download uploaded form files the same way as the legacy fix?
- Are masks/display fixes already present in customer/seller settings screens?
- Are there route/attachment security differences between legacy and v2?

## Initial recommendation

Do a file-by-file comparison against the current v2 form submissions feature before implementing. Likely outcome: small bridge/UI fix plus tests, or record as already covered.
