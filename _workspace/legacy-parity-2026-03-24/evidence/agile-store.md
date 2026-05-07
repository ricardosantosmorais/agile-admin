# Evidence: agile-store

Batch: `agile-store`
Legacy date range: 2026-04-30..2026-05-03

## Fatia migrada nesta etapa

Foi migrada a superfície pública da Agile Store:

- listagem de módulos em `/agile-store`;
- detalhe em `/agile-store/[id]`;
- bridges para listagem, detalhe, contratar, descontratar e reprocessar;
- normalização de cards, benefícios, preço, teste grátis, status e policies de ação;
- rota de menu do componente legado `app-store-list`;
- permissão v2 `agileStore` baseada nas chaves legadas `APP_STORE`, `APP_STORE_VISUALIZAR`, `APP_STORE_CONTRATAR` e `APP_STORE_DESCONTRATAR`;
- documentação em `docs/50-modulo-agile-store.md`.

## Legacy commits cobertos pela fatia pública

| Commits | Decisão |
|---|---|
| `b22d6f726`, `1bdf6883c`, `625d01446`, `3f58e9ec9`, `40ae48336`, `5f71a28c1`, `627466a0d`, `116d1536e`, `5815d3097`, `0547ad75b`, `b6d2ed6a3`, `d4048aa7d`, `67b9d72c6`, `67c678c7e`, `73b2d907d`, `972fd3acb`, `216909ae0`, `8697215c9`, `1cd03ce5a`, `5ed2728fb`, `67586134f`, `f105917af` | Migrados/adaptados para a fatia pública do v2 quando relacionados a vitrine, detalhe, permissões, filtros, ações e policies da Agile Store. Assets comerciais foram representados por URLs vindas da API v3 em vez de copiar arquivos do legado. |

## Fora desta etapa

| Área | Motivo |
|---|---|
| SAC admin (`sac-dashboard`, `sac-chamados`, áreas, assuntos, configurações) | Precisa de fatia própria porque usa contratos `sac/admin/*`, permissões `SAC_*`, anexos e fluxos operacionais de chamados. |
| Retaguarda da Agile Store (`app-store-admin`) | Precisa de fatia própria porque envolve métricas, visitas/eventos, faturamento e cancelamento administrativo. |
| Materiais comerciais versionados do SAC | A API v3 já expõe mídias/URLs para a vitrine; copiar os binários do legado para o v2 não é necessário nesta arquitetura. |

## Validação focada

- `.\npxw.cmd vitest run src\features\agile-store\services\agile-store-mappers.test.ts app\api\agile-store\route.test.ts src\features\agile-store\components\agile-store-pages.test.tsx`
- `.\npxw.cmd vitest run src\features\sac-admin\services\sac-admin-mappers.test.ts app\api\sac\route.test.ts src\features\sac-admin\components\sac-admin-page.test.tsx`

## Fatia SAC admin operacional

Foi migrada a superfície principal de operação do SAC:

- rota `/sac` com dashboard resumido, filtros e listagem de chamados;
- bridges `app/api/sac/*` para `sac/admin/dashboard`, `sac/admin/chamados`, detalhe e ações;
- normalização de dashboard, chamados, mensagens, eventos, itens e anexos;
- modal de detalhe com histórico e resposta ao cliente;
- ordenação default por `ultima_interacao_em desc`, preservando o comportamento legado;
- permissão local `sac` e menu para `sac-dashboard`/`sac-chamados`;
- documentação em `docs/51-modulo-sac-admin.md`.

### Fora desta fatia SAC

| Área | Motivo |
|---|---|
| Áreas, assuntos e configurações do SAC | São cadastros/configurações próprios, com contratos e permissões separadas. |
| Upload completo de anexos na resposta | A resposta sem anexos foi migrada primeiro; upload requer fluxo de arquivos dedicado. |
| Transferência, atribuição, nota interna e status com formulários completos | As bridges existem, mas a UI operacional completa fica para a próxima fatia. |
