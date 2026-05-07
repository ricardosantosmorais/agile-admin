# Evidence: SAC admin ações avançadas

Batch: `agile-store/sac-admin-acoes-avancadas`
Legacy reference: `C:\Projetos\admin\controllers\sac-controller.php` e `C:\Projetos\admin\assets\js\components\sac.js`

## Fatia migrada

Foi migrada a camada operacional avançada do SAC sem criar itens fixos de menu:

- permissões finas `SAC_FUNC_LISTAR_TODOS`, `SAC_FUNC_NOTA_INTERNA`, `SAC_FUNC_ALTERAR_STATUS`, `SAC_FUNC_ATRIBUIR_RESPONSAVEL` e `SAC_FUNC_TRANSFERIR`;
- lookups `sac/admin/areas`, `sac/admin/assuntos` e `sac/admin/usuarios` via bridges locais;
- filtros por área, assunto e responsável;
- regra legada de restringir chamados ao usuário atual quando o perfil não possui `SAC_FUNC_LISTAR_TODOS`;
- formulários de nota interna, alteração de status, atribuição e transferência no detalhe do chamado;
- preservação de `updated_at` em todas as ações operacionais para manter a proteção contra concorrência.

## Menu

O menu da empresa continua dinâmico e vindo do banco/perfil, como no legado. Esta fatia só garante que os componentes/rotas existentes sejam resolvidos quando o menu recebido apontar para `sac-dashboard` ou `sac-chamados`; não adiciona novo item fixo de navegação.

## Ainda fora do SAC

| Área | Motivo |
|---|---|
| Áreas, assuntos e configurações do SAC | São cadastros/configurações próprios, com contratos de escrita e permissões separadas. |
| Upload completo de anexos na resposta | Requer fluxo de arquivo dedicado para envio junto da mensagem. |
| Retaguarda da Agile Store | Envolve gestão administrativa da loja, métricas, faturamento e cancelamento administrativo. |

## Validação focada

- `.\npxw.cmd vitest run src\features\sac-admin\services\sac-admin-mappers.test.ts app\api\sac\route.test.ts src\features\sac-admin\components\sac-admin-page.test.tsx`
