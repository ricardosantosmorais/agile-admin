# Agile Store ajustes: feedback, benefícios e materiais

## Legado analisado

- `assets/js/components/app-store-detail.js`
- `assets/js/components/app-store-admin.js`
- `components/app-store-detail.php`
- `components/app-store-admin.php`
- `controllers/app-store-controller.php`

Commits de referência: `cf3cd5b63`, `7e6973838`, `73cc7f9da`, `2088bd540`.

## Paridade aplicada no v2

- Contratar e descontratar módulo agora exigem motivo de feedback, seguindo os motivos do legado.
- A mensagem opcional de feedback é limitada no formulário e enviada junto da ação.
- A bridge `app/api/agile-store/[id]/action` encaminha `feedback_motivo` e `feedback_mensagem` para a API v3 em contratar/descontratar.
- Histórico do detalhe exibe motivo/mensagem de feedback e erro retornado pela execução.
- Retaguarda `/agile-store/admin` exibe feedback em contratos e eventos recentes.
- Mappers aceitam poster de vídeo por `poster_url`/`poster`.
- Benefícios do detalhe priorizam `beneficios_detalhe`, depois `beneficiosDetalhe`, `ganhos` e, por fim, `beneficios`.

## Decisão

Os arquivos estáticos de materiais do legado não foram copiados para o v2. O v2 consome materiais, posters e imagens pelo payload/URL retornado pela API, mantendo a arquitetura moderna sem duplicar assets versionados no frontend.

## Validação

- `.\npxw.cmd vitest run src/features/agile-store/components/agile-store-pages.test.tsx`
- `.\npxw.cmd vitest run src/features/agile-store/services/agile-store-mappers.test.ts src/features/agile-store/services/agile-store-admin-mappers.test.ts app/api/agile-store/route.test.ts src/features/agile-store/components/agile-store-pages.test.tsx`
- `.\npmw.cmd run typecheck`
- `.\npmw.cmd run lint`

Observação: a primeira execução agrupada teve um timeout intermitente no teste pesado da retaguarda. O teste passou isolado com timeout ampliado e, em seguida, o arquivo completo passou no timeout padrão.
