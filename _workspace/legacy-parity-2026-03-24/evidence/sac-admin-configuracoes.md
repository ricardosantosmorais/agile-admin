# Evidence: SAC admin configuracoes

Batch: `agile-store/sac-admin-configuracoes`
Legacy reference: `C:\Projetos\admin\controllers\sac-controller.php` e `C:\Projetos\admin\assets\js\components\sac.js`

## Fatia migrada

Foi migrada a camada de configuracao administrativa do SAC sem criar itens fixos de menu:

- configuracao do modulo em `sac/admin/configuracoes`, com `ativo`, `emails_permitidos`, `fechamento_automatico_dias` e `prazo_reabertura_dias`;
- cadastro de areas em `sac/admin/areas`, incluindo nome, SLA, ativo e exibicao do responsavel para o cliente;
- cadastro de assuntos em `sac/admin/assuntos`, incluindo area, nome, vinculo de pedido, obrigatoriedade de pedido e ativo;
- cadastro de responsaveis por area em `sac/admin/areas/{id}/responsaveis`;
- bridges locais para `GET`, `POST` e `DELETE` dos contratos administrativos usados pelo legado;
- mapeadores tipados para configuracao, areas, assuntos e responsaveis;
- superficie React dentro de `/sac`, liberada apenas por `SAC_FUNC_CONFIGURAR_MODULO` e/ou `SAC_FUNC_CONFIGURAR_AREAS`;
- i18n PT/EN e documentacao do modulo.

## Menu

O menu da empresa continua dinamico e vindo do banco/perfil, como no legado. Esta fatia nao registra item fixo no menu; ela apenas garante que a rota `/sac` exponha a superficie administrativa quando o usuario possuir as permissoes recebidas da sessao.

## Ainda fora do SAC

| Area | Motivo |
|---|---|
| Upload completo de anexos na resposta | Requer fluxo de arquivo dedicado para envio junto da mensagem. |
| Retaguarda da Agile Store | Envolve gestao administrativa da loja, metricas, faturamento e cancelamento administrativo. |

## Validacao focada

- `.\npxw.cmd vitest run src\features\sac-admin\services\sac-admin-mappers.test.ts app\api\sac\route.test.ts src\features\sac-admin\components\sac-admin-page.test.tsx`
- `.\npmw.cmd run lint`
- `.\npmw.cmd run typecheck`
