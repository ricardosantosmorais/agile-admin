# Batch: contatos

Commits: 3
Date range: 2026-04-08..2026-04-28

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-04-08 | 4b59fff2d | ui-flow-or-visual | not-applicable | Ajusta separador dos contatos no modal | 1 |
| 2026-04-09 | 7ac000ca6 | new-feature-or-screen | migrated | feat(contatos): ajusta edição de contatos no admin | 4 |
| 2026-04-28 | 607636dbb | form-field-or-form-flow | migrated | Adiciona parametro de contato duplicado | 1 |

## Detailed commits

### 4b59fff2d - Ajusta separador dos contatos no modal

- Date: 2026-04-08
- Type: ui-flow-or-visual
- Disposition: not-applicable
- Decision: ajuste visual do modal de pendencia financeira em `billing-upgrade`, sem superficie equivalente no lote de `Contatos` do v2.
- Files:
  - M controllers/billing-upgrade-controller.php

### 7ac000ca6 - feat(contatos): ajusta edição de contatos no admin

- Date: 2026-04-09
- Type: new-feature-or-screen
- Disposition: migrated
- Decision: migrada edicao administrativa de contatos nao internalizados, com acao na listagem/detalhe, modal de edicao, normalizacao de payload e bloqueio na bridge para contatos ja internalizados.
- Files:
  - M assets/js/components/contatos-list.js
  - A components/contato-editar.php
  - M components/contatos-list.php
  - M controllers/contatos-controller.php

### 607636dbb - Adiciona parametro de contato duplicado

- Date: 2026-04-28
- Type: form-field-or-form-flow
- Disposition: migrated
- Decision: migrado parametro `permite_cadastro_contato_duplicado` em `Configuracoes > Clientes`, com i18n e cobertura de mapper/payload.
- Files:
  - M components/configuracoes-clientes-form.php
