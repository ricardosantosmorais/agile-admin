# Batch: pedidos

Commits: 19
Date range: 2026-03-26..2026-04-29

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-26 | b25101f37 | form-field-or-form-flow | compare-and-likely-migrate | fix(pedidos-detalhe): ajustar timezone para GMT-3 nos campos de data | 1 |
| 2026-04-10 | 63dd49629 | behavior-change | compare-and-likely-migrate | Hide technical order logs by default | 1 |
| 2026-04-10 | 8f5474789 | ui-flow-or-visual | compare-and-likely-migrate | Fix order detail logs modal rendering | 1 |
| 2026-04-10 | fc467b194 | behavior-change | compare-and-likely-migrate | Hide technical log json actions by default | 1 |
| 2026-04-10 | cf1718b24 | behavior-change | compare-and-likely-migrate | Restringe logs tecnicos a usuarios master | 1 |
| 2026-04-10 | 7faa02b22 | bugfix | compare-and-likely-migrate | Corrige exibicao de botoes de log tecnico | 1 |
| 2026-04-10 | 7a57640cb | bugfix | compare-and-likely-migrate | Corrige carga de produtos e logs no detalhe do pedido | 1 |
| 2026-04-10 | 4eccfd8e5 | cache-or-assets | compare-and-likely-migrate | Explica regras de rastreabilidade no detalhe do pedido | 5 |
| 2026-04-10 | 72e2e3948 | ui-flow-or-visual | compare-and-likely-migrate | Corrige modal tecnico do detalhe do pedido | 3 |
| 2026-04-10 | cb2092f78 | ui-flow-or-visual | compare-and-likely-migrate | Corrige estabilidade e layout do modal tecnico | 2 |
| 2026-04-10 | 4ed6755d0 | ui-flow-or-visual | compare-and-likely-migrate | Alinha modal tecnico ao tamanho do detalhe do pedido | 1 |
| 2026-04-11 | 026924a2b | new-feature-or-screen | compare-and-likely-migrate | Adiciona memoria de preco no detalhe do pedido | 3 |
| 2026-04-11 | 49574a473 | bugfix | compare-and-likely-migrate | Corrige exibicao da memoria de preco no detalhe | 1 |
| 2026-04-11 | 1be48e949 | cache-or-assets | compare-and-likely-migrate | Ajusta camadas e tamanhos dos modais do detalhe | 3 |
| 2026-04-11 | 2e29335c3 | ui-flow-or-visual | compare-and-likely-migrate | Ajusta layout da memoria de preco | 1 |
| 2026-04-11 | f1c9667fe | new-feature-or-screen | compare-and-likely-migrate | Adiciona cabecalho do produto aos modais tecnicos | 3 |
| 2026-04-11 | 8db993d97 | bugfix | compare-and-likely-migrate | Corrige mascara dos modais do detalhe | 2 |
| 2026-04-28 | 4dac71c45 | new-feature-or-screen | compare-and-likely-migrate | Adiciona configuracao para exibir juros nas parcelas | 1 |
| 2026-04-29 | cb009f47b | new-feature-or-screen | compare-and-likely-migrate | feat: adiciona status de entrega devolvido e solicitado | 5 |

## Detailed commits

### b25101f37 - fix(pedidos-detalhe): ajustar timezone para GMT-3 nos campos de data

- Date: 2026-03-26
- Type: form-field-or-form-flow
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 63dd49629 - Hide technical order logs by default

- Date: 2026-04-10
- Type: behavior-change
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 8f5474789 - Fix order detail logs modal rendering

- Date: 2026-04-10
- Type: ui-flow-or-visual
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### fc467b194 - Hide technical log json actions by default

- Date: 2026-04-10
- Type: behavior-change
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### cf1718b24 - Restringe logs tecnicos a usuarios master

- Date: 2026-04-10
- Type: behavior-change
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 7faa02b22 - Corrige exibicao de botoes de log tecnico

- Date: 2026-04-10
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 7a57640cb - Corrige carga de produtos e logs no detalhe do pedido

- Date: 2026-04-10
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 4eccfd8e5 - Explica regras de rastreabilidade no detalhe do pedido

- Date: 2026-04-10
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php
  - M components/pedidos-detalhe.php
  - M docs/ai/skills/ui-ux/components.md
  - M includes/helpers.php

### 72e2e3948 - Corrige modal tecnico do detalhe do pedido

- Date: 2026-04-10
- Type: ui-flow-or-visual
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php
  - M components/pedidos-detalhe.php

### cb2092f78 - Corrige estabilidade e layout do modal tecnico

- Date: 2026-04-10
- Type: ui-flow-or-visual
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M components/pedidos-detalhe.php

### 4ed6755d0 - Alinha modal tecnico ao tamanho do detalhe do pedido

- Date: 2026-04-10
- Type: ui-flow-or-visual
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 026924a2b - Adiciona memoria de preco no detalhe do pedido

- Date: 2026-04-11
- Type: new-feature-or-screen
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php
  - M components/pedidos-detalhe.php

### 49574a473 - Corrige exibicao da memoria de preco no detalhe

- Date: 2026-04-11
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 1be48e949 - Ajusta camadas e tamanhos dos modais do detalhe

- Date: 2026-04-11
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php
  - M components/pedidos-detalhe.php

### 2e29335c3 - Ajusta layout da memoria de preco

- Date: 2026-04-11
- Type: ui-flow-or-visual
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### f1c9667fe - Adiciona cabecalho do produto aos modais tecnicos

- Date: 2026-04-11
- Type: new-feature-or-screen
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php
  - M components/pedidos-detalhe.php

### 8db993d97 - Corrige mascara dos modais do detalhe

- Date: 2026-04-11
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php

### 4dac71c45 - Adiciona configuracao para exibir juros nas parcelas

- Date: 2026-04-28
- Type: new-feature-or-screen
- Disposition: compare-and-likely-migrate
- Files:
  - M components/configuracoes-pedidos-form.php

### cb009f47b - feat: adiciona status de entrega devolvido e solicitado

- Date: 2026-04-29
- Type: new-feature-or-screen
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/pedidos-detalhe.js
  - M boot.php
  - M components/pedidos-detalhe.php
  - M controllers/pedidos-entrega-controller.php
  - M includes/helpers.php
