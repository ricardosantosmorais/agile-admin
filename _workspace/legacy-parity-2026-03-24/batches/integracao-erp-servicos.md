# Batch: integracao-erp/servicos

Commits: 7
Date range: 2026-03-24..2026-04-22

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-24 | 9a13e0879 | new-feature-or-screen | migrated | feat: suportar dataset consolidado no mapeamento de servicos | 8 |
| 2026-03-27 | 02c369878 | behavior-change | already-covered | Correção do botão de abortar execução em serviços execuções | 2 |
| 2026-03-30 | 6e9b5f7f3 | ui-flow-or-visual | migrated | Improve integration execution log modal | 3 |
| 2026-04-13 | e6686a8f8 | new-feature-or-screen | not-applicable | feat: improve protheus auth diagnostics in admin | 5 |
| 2026-04-13 | 5316cdd22 | cache-or-assets | not-applicable | Ajusta acentuacao das mensagens Protheus | 4 |
| 2026-04-17 | 2883f5bf3 | bugfix | already-covered | fix: resetar paginação dos detalhes de execução no admin | 1 |
| 2026-04-22 | e334b4312 | cache-or-assets | already-covered | Otimiza carregamento de servicos de integracao | 3 |

## Detailed commits

### 9a13e0879 - feat: suportar dataset consolidado no mapeamento de servicos

- Date: 2026-03-24
- Type: new-feature-or-screen
- Disposition: migrated
- Files:
  - M assets/js/components/cadastro-servicos-form.js
  - M assets/js/components/servicos-integracao-form.js
  - M boot.php
  - M components/assistente-mapeamento-endpoint-gateway.php
  - M components/cadastro-servicos-form.php
  - M components/servicos-integracao-endpoint-gateway-form.php
  - M controllers/cadastro-servicos-controller.php
  - M docs/12-servicos-query-sqlite-endpoint-gateway.md

### 02c369878 - Correção do botão de abortar execução em serviços execuções

- Date: 2026-03-27
- Type: behavior-change
- Disposition: already-covered
- Files:
  - M components/configuracoes-produtos-form.php
  - M controllers/servicos-integracao-controller.php

### 6e9b5f7f3 - Improve integration execution log modal

- Date: 2026-03-30
- Type: ui-flow-or-visual
- Disposition: migrated
- Files:
  - M assets/js/components/servicos-integracao-form.js
  - M components/servicos-integracao-form.php
  - M controllers/servicos-integracao-controller.php

### e6686a8f8 - feat: improve protheus auth diagnostics in admin

- Date: 2026-04-13
- Type: new-feature-or-screen
- Disposition: not-applicable
- Files:
  - M assets/js/components/editor-sql-tabed-form.js
  - M assets/js/scripts.js
  - M boot.php
  - M controllers/servicos-integracao-controller.php
  - M includes/header.php

### 5316cdd22 - Ajusta acentuacao das mensagens Protheus

- Date: 2026-04-13
- Type: cache-or-assets
- Disposition: not-applicable
- Files:
  - M assets/js/components/editor-sql-tabed-form.js
  - M assets/js/scripts.js
  - M boot.php
  - M controllers/servicos-integracao-controller.php

### 2883f5bf3 - fix: resetar paginação dos detalhes de execução no admin

- Date: 2026-04-17
- Type: bugfix
- Disposition: already-covered
- Files:
  - M assets/js/components/servicos-integracao-form.js

### e334b4312 - Otimiza carregamento de servicos de integracao

- Date: 2026-04-22
- Type: cache-or-assets
- Disposition: already-covered
- Files:
  - M assets/js/components/servicos-integracao-form.js
  - M boot.php
  - M controllers/servicos-integracao-controller.php
