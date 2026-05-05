# Batch: simulador-precos

Commits: 11
Date range: 2026-03-27..2026-04-13

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-27 | f97027430 | cache-or-assets | compare-and-likely-migrate | Add freight input to price simulator | 2 |
| 2026-03-27 | 04635ae51 | bugfix | compare-and-likely-migrate | Fix decimal freight input in price simulator | 2 |
| 2026-03-27 | 1efbe4b0d | cache-or-assets | compare-and-likely-migrate | Align simulator freight input with delivery rule money pattern | 2 |
| 2026-03-27 | c5ce9b0f0 | bugfix | compare-and-likely-migrate | Remove custom freight validation from simulator money field | 2 |
| 2026-03-27 | e7cd37f4f | cache-or-assets | compare-and-likely-migrate | Send unmasked freight value from simulator | 1 |
| 2026-03-27 | 0bb0e9d95 | cache-or-assets | compare-and-likely-migrate | Serialize simulator form values on submit | 1 |
| 2026-03-27 | c01e0080a | behavior-change | compare-and-likely-migrate | Send simulator packaging in API-compatible format | 1 |
| 2026-03-27 | 629769c7f | cache-or-assets | compare-and-likely-migrate | Normalize masked freight value before simulator submit | 1 |
| 2026-03-27 | b88f9f59b | behavior-change | compare-and-likely-migrate | Keep simulator freight fix scoped to freight parameter | 1 |
| 2026-04-11 | 7dbb9525f | behavior-change | compare-and-likely-migrate | Alinha memoria de preco ao simulador | 1 |
| 2026-04-13 | 6ae00a8b3 | bugfix | compare-and-likely-migrate | fix: corrige chamada getApiV1 inexistente para getApiV2 no simulador de precos | 1 |

## Detailed commits

### f97027430 - Add freight input to price simulator

- Date: 2026-03-27
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js
  - M components/simulador-precos.php

### 04635ae51 - Fix decimal freight input in price simulator

- Date: 2026-03-27
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js
  - M components/simulador-precos.php

### 1efbe4b0d - Align simulator freight input with delivery rule money pattern

- Date: 2026-03-27
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js
  - M components/simulador-precos.php

### c5ce9b0f0 - Remove custom freight validation from simulator money field

- Date: 2026-03-27
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js
  - M components/simulador-precos.php

### e7cd37f4f - Send unmasked freight value from simulator

- Date: 2026-03-27
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js

### 0bb0e9d95 - Serialize simulator form values on submit

- Date: 2026-03-27
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js

### c01e0080a - Send simulator packaging in API-compatible format

- Date: 2026-03-27
- Type: behavior-change
- Disposition: compare-and-likely-migrate
- Files:
  - M components/simulador-precos.php

### 629769c7f - Normalize masked freight value before simulator submit

- Date: 2026-03-27
- Type: cache-or-assets
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/simulador-precos.js

### b88f9f59b - Keep simulator freight fix scoped to freight parameter

- Date: 2026-03-27
- Type: behavior-change
- Disposition: compare-and-likely-migrate
- Files:
  - M components/simulador-precos.php

### 7dbb9525f - Alinha memoria de preco ao simulador

- Date: 2026-04-11
- Type: behavior-change
- Disposition: compare-and-likely-migrate
- Files:
  - M components/pedidos-detalhe.php

### 6ae00a8b3 - fix: corrige chamada getApiV1 inexistente para getApiV2 no simulador de precos

- Date: 2026-04-13
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M components/simulador-precos.php
