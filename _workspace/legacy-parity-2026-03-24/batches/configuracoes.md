# Batch: configuracoes

Commits: 12
Date range: 2026-03-25..2026-04-29

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-25 | 22638a2f5 | ui-flow-or-visual | triage-needed | Ajusta instrucao do modal de precos | 1 |
| 2026-03-25 | e4a8c7358 | form-field-or-form-flow | triage-needed | Adiciona parametro de estoque no assistente | 1 |
| 2026-03-25 | 652569364 | cache-or-assets | triage-needed | Ajusta renovacao de cache e label da URL API | 6 |
| 2026-03-25 | fe2db7d06 | bugfix | triage-needed | Restaura opcoes fixas nas configuracoes gerais | 2 |
| 2026-03-25 | 4da2066cc | behavior-change | triage-needed | Ajusta opcoes fixas da URL API | 2 |
| 2026-03-25 | 4c30ba50c | form-field-or-form-flow | triage-needed | Corrige cache v2 e restaura formulario geral | 2 |
| 2026-03-25 | 60ea3435f | bugfix | triage-needed | Corrige opcoes fixas das configuracoes gerais | 1 |
| 2026-03-25 | c463a8957 | bugfix | triage-needed | Restaura opcoes fixas nas configuracoes gerais | 1 |
| 2026-03-29 | e4356e219 | form-field-or-form-flow | triage-needed | Inicializa parametros ao publicar versao do cache | 1 |
| 2026-04-10 | 4e70062f0 | cache-or-assets | triage-needed | Inclusão dos Parâmetros para Área do Vendedor V2 | 4 |
| 2026-04-10 | 25d54d0b3 | behavior-change | triage-needed | Inclusão de lógica controller | 1 |
| 2026-04-29 | e3007392e | cache-or-assets | triage-needed | Inclusão das cotas para vendedores da área V2 | 6 |

## Detailed commits

### 22638a2f5 - Ajusta instrucao do modal de precos

- Date: 2026-03-25
- Type: ui-flow-or-visual
- Disposition: triage-needed
- Files:
  - M components/configuracoes-produtos-form.php

### e4a8c7358 - Adiciona parametro de estoque no assistente

- Date: 2026-03-25
- Type: form-field-or-form-flow
- Disposition: triage-needed
- Files:
  - M components/configuracoes-produtos-form.php

### 652569364 - Ajusta renovacao de cache e label da URL API

- Date: 2026-03-25
- Type: cache-or-assets
- Disposition: triage-needed
- Files:
  - M boot.php
  - M components/configuracoes-geral-form.php
  - M controllers/api-controller.php
  - M docs/02-mapa-do-repo.md
  - M docs/06-padroes-por-area.md
  - M includes/helpers.php

### fe2db7d06 - Restaura opcoes fixas nas configuracoes gerais

- Date: 2026-03-25
- Type: bugfix
- Disposition: triage-needed
- Files:
  - M boot.php
  - M components/configuracoes-geral-form.php

### 4da2066cc - Ajusta opcoes fixas da URL API

- Date: 2026-03-25
- Type: behavior-change
- Disposition: triage-needed
- Files:
  - M boot.php
  - M components/configuracoes-geral-form.php

### 4c30ba50c - Corrige cache v2 e restaura formulario geral

- Date: 2026-03-25
- Type: form-field-or-form-flow
- Disposition: triage-needed
- Files:
  - M components/configuracoes-geral-form.php
  - M includes/helpers.php

### 60ea3435f - Corrige opcoes fixas das configuracoes gerais

- Date: 2026-03-25
- Type: bugfix
- Disposition: triage-needed
- Files:
  - M components/configuracoes-geral-form.php

### c463a8957 - Restaura opcoes fixas nas configuracoes gerais

- Date: 2026-03-25
- Type: bugfix
- Disposition: triage-needed
- Files:
  - M components/configuracoes-geral-form.php

### e4356e219 - Inicializa parametros ao publicar versao do cache

- Date: 2026-03-29
- Type: form-field-or-form-flow
- Disposition: triage-needed
- Files:
  - M controllers/api-controller.php

### 4e70062f0 - Inclusão dos Parâmetros para Área do Vendedor V2

- Date: 2026-04-10
- Type: cache-or-assets
- Disposition: triage-needed
- Files:
  - M assets/js/components/configuracoes-vendedores-form.js
  - M boot.php
  - M components/configuracoes-vendedores-form.php
  - M controllers/configuracoes-vendedores-controller.php

### 25d54d0b3 - Inclusão de lógica controller

- Date: 2026-04-10
- Type: behavior-change
- Disposition: triage-needed
- Files:
  - M controllers/configuracoes-vendedores-controller.php

### e3007392e - Inclusão das cotas para vendedores da área V2

- Date: 2026-04-29
- Type: cache-or-assets
- Disposition: triage-needed
- Files:
  - M assets/js/components/configuracoes-vendedores-form.js
  - M boot.php
  - M components/configuracoes-vendedores-form.php
  - M components/vendedores-form.php
  - M controllers/configuracoes-vendedores-controller.php
  - M controllers/vendedores-controller.php
