# pedidos

Legacy commits checked:

- `b25101f37` - fix(pedidos-detalhe): ajustar timezone para GMT-3 nos campos de data
- `63dd49629` - Hide technical order logs by default
- `8f5474789` - Fix order detail logs modal rendering
- `fc467b194` - Hide technical log json actions by default
- `cf1718b24` - Restringe logs tecnicos a usuarios master
- `7faa02b22` - Corrige exibicao de botoes de log tecnico
- `7a57640cb` - Corrige carga de produtos e logs no detalhe do pedido
- `4eccfd8e5` - Explica regras de rastreabilidade no detalhe do pedido
- `72e2e3948` - Corrige modal tecnico do detalhe do pedido
- `cb2092f78` - Corrige estabilidade e layout do modal tecnico
- `4ed6755d0` - Alinha modal tecnico ao tamanho do detalhe do pedido
- `026924a2b` - Adiciona memoria de preco no detalhe do pedido
- `49574a473` - Corrige exibicao da memoria de preco no detalhe
- `1be48e949` - Ajusta camadas e tamanhos dos modais do detalhe
- `2e29335c3` - Ajusta layout da memoria de preco
- `f1c9667fe` - Adiciona cabecalho do produto aos modais tecnicos
- `8db993d97` - Corrige mascara dos modais do detalhe
- `4dac71c45` - Adiciona configuracao para exibir juros nas parcelas
- `cb009f47b` - feat: adiciona status de entrega devolvido e solicitado

## Current v2 coverage found

- The v2 already has the orders list, order detail, operational actions, internal notes, delivery update form, JSON modal, products, timeline, details, and logs.
- The v2 already formats order dates through the shared frontend date-time helper; no route/contract migration was required for the legacy GMT-3 PHP formatting commit in this pass.
- Order status metadata already had returned order statuses such as `devolvido` and `devolvido_parcial`.

## Migrated in this batch

- Added delivery status options `devolvido` and `solicitado` to the order delivery update form.
- Added the legacy `exibe_juros_parcelas` setting to `Configuracoes > Pedidos`, including dirty payload, type coverage, and PT/EN i18n.
- Filtered technical order logs for non-master users using the legacy rule:
  - codes starting with `processing_`
  - code `origin_trace_snapshot`
- Added master-only product actions to open price memory and product origin trace payloads from the order detail.

## Coverage and validation

- `src/features/pedidos/services/pedidos-mappers.test.ts`
- `src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers.test.ts`
- `npxw.cmd vitest run src/features/pedidos/services/pedidos-mappers.test.ts src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers.test.ts`
- `npxw.cmd eslint <touched files>`
- `npmw.cmd run typecheck`
- `npmw.cmd run lint`
- `npmw.cmd run build`

## Follow-up note

- The master price-memory action currently opens the normalized payload in the existing technical modal. A future polish pass can render it as richer v2 tables, similar to the simulator result panels.
