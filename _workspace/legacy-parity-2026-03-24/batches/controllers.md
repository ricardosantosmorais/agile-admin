# Batch: controllers

Commits: 5
Date range: 2026-03-26..2026-04-17

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-26 | 8df9be0ff | behavior-change | migrated | Admin usa PainelB2BApi no Editor SQL | 3 |
| 2026-03-29 | f4235fad3 | cache-or-assets | migrated | Simplifica renovacao de cache para API efetiva | 2 |
| 2026-03-31 | 2c4ee3ef4 | form-field-or-form-flow | migrated | Fix admin cache invalidation flows | 4 |
| 2026-04-02 | c5e30a6c7 | bugfix | not-applicable | fix: gate billing banner by cobranca_upgrade | 1 |
| 2026-04-17 | 929884d06 | cache-or-assets | migrated | Improve remote cache invalidation observability | 2 |

## Detailed commits

### 8df9be0ff - Admin usa PainelB2BApi no Editor SQL

- Date: 2026-03-26
- Type: behavior-change
- Disposition: migrated
- Files:
  - M boot.php
  - M controllers/editor-sql-controller.php
  - M controllers/editor-sql-tabed-controller.php
- V2 decision:
  - `app/api/editor-sql/_shared.ts` agora executa o endpoint `agilesync_editorsql` sempre no alvo `painelb2b`, inclusive para fonte `ERP`.
  - A consulta extra de `protheus_tipo_integracao` foi removida do contexto do Editor SQL no v2.
  - Cobertura adicionada em `app/api/editor-sql/_shared.test.ts`.

### f4235fad3 - Simplifica renovacao de cache para API efetiva

- Date: 2026-03-29
- Type: cache-or-assets
- Disposition: migrated
- Files:
  - M boot.php
  - M controllers/api-controller.php
- V2 decision:
  - `app/api/renovar-cache/route.ts` ja executava a API efetiva do cluster quando configurada e mantinha fallback para `api-v3`.
  - `src/services/http/cache-invalidation.ts` agora tambem permite invalidacao completa via `cache/clear`, nao apenas segmentada.
  - Cobertura adicionada em `src/services/http/cache-invalidation.test.ts`.

### 2c4ee3ef4 - Fix admin cache invalidation flows

- Date: 2026-03-31
- Type: form-field-or-form-flow
- Disposition: migrated
- Files:
  - M controllers/api-controller.php
  - M controllers/areas-pagina-controller.php
  - M controllers/componentes-campos-controller.php
  - M controllers/componentes-controller.php
- V2 decision:
  - `app/api/componentes/route.ts`, `app/api/componentes-campos/route.ts` e `app/api/areas-paginas/route.ts` invalidam cache completo depois de `POST` e `DELETE` bem-sucedidos.
  - Em `componentes-campos`, o mesmo POST cobre a reordenacao de campos, como no fluxo moderno existente.
  - Cobertura adicionada para os tres endpoints.

### c5e30a6c7 - fix: gate billing banner by cobranca_upgrade

- Date: 2026-04-02
- Type: bugfix
- Disposition: not-applicable
- Files:
  - M controllers/billing-upgrade-controller.php
- V2 decision:
  - Nao existe superficie equivalente de `billing-upgrade` ou banner de cobranca no Admin v2 atual.
  - O ajuste fica registrado como nao aplicavel ate esse modulo existir no v2.

### 929884d06 - Improve remote cache invalidation observability

- Date: 2026-04-17
- Type: cache-or-assets
- Disposition: migrated
- Files:
  - M controllers/api-controller.php
  - M includes/tenant-context.php
- V2 decision:
  - O v2 usa Sentry como observabilidade operacional server-side.
  - `app/api/renovar-cache/route.ts` agora registra falhas da chamada direta ao cluster como `remote-cache/renew-cache`, com tenant e metadados sem token.
  - A invalidacao por helper ja captura excecoes via `captureOperationalServerError`.
  - Cobertura adicionada em `app/api/renovar-cache/route.test.ts`.
