# SAC Admin Operacional Design

## Decisão

Migrar a fatia operacional mínima do SAC legado para o v2 em `/sac`, sem misturar a retaguarda da Agile Store nem os cadastros de áreas, assuntos e configurações.

## Escopo

- Dashboard com KPIs principais vindos de `sac/admin/dashboard`.
- Listagem de chamados vindos de `sac/admin/chamados`, mantendo filtros de status, cliente/protocolo e ordenação por última interação.
- Detalhe de chamado via modal operacional, carregado sob demanda por `sac/admin/chamados/{id}`.
- Resposta ao cliente como primeira ação escrita, encaminhada para `sac/admin/chamados/{id}/responder`.
- Mapeamento de `sac-dashboard` e `sac-chamados` no menu do v2.
- Permissões locais agrupadas em `sac`, preservando a família `SAC_*` do legado.

## Fora Do Escopo

- CRUD de áreas e assuntos.
- Configurações do módulo SAC.
- Upload completo de anexos.
- Atribuição, transferência, nota interna e alteração de status como formulários completos.
- Backoffice `app-store-admin`.

## Validação

Cobrir mappers, bridges e tela operacional com Vitest. Como há rota nova no App Router, rodar typecheck, lint e build no fechamento.
