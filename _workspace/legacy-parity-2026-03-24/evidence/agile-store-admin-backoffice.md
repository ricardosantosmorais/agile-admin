# Evidence: Agile Store admin backoffice

Batch: `agile-store/admin-backoffice`
Legacy reference: `C:\Projetos\admin\components\app-store-admin.php`, `C:\Projetos\admin\controllers\app-store-admin-controller.php` e `C:\Projetos\admin\assets\js\components\app-store-admin.js`
API reference: `C:\Projetos\api-v3\routes\api.php` e `C:\Projetos\api-v3\app\Http\Controllers\AppStoreController.php`

## Fatia migrada

Foi migrada a retaguarda de gestão da Agile Store sem criar item fixo de menu:

- rota `/agile-store/admin`, acionada quando o menu dinâmico trouxer o componente legado `app-store-admin`;
- bridge `GET /api/agile-store/admin/dashboard` para `app-store/admin/dashboard`;
- bridges administrativas de contrato:
  - `POST /api/agile-store/admin/contratacoes/{id}/faturamento`;
  - `POST /api/agile-store/admin/contratacoes/{id}/descontratar`;
- mapeadores para summary, período, performance por módulo, tendência, visitas/eventos, clientes/contratações e eventos recentes;
- superfície React com filtros de período/geral, produto, faturamento e busca;
- cards de visitas, contratos, MRR e gratuidades;
- leitura de visitas, performance por módulo, contratações/faturamento e eventos recentes;
- ações administrativas para marcar faturamento e descontratar contrato por ID.

## Menu e acesso

O menu da empresa continua dinâmico e vindo do banco/perfil. Esta fatia apenas mapeia `app-store-admin` para `/agile-store/admin`.

A proteção fina da retaguarda segue na API v3, como no legado, com validação de usuário interno Agile e tenant interno. O v2 encaminha token e tenant ativo por aba e exibe o erro retornado pela bridge/API quando o acesso não for permitido.

## Ainda fora da Agile Store/SAC

| Área | Motivo |
|---|---|
| Upload completo de anexos na resposta do SAC | Requer fluxo de arquivo dedicado para envio junto da mensagem. |
| CRUD administrativo do catálogo de módulos/scripts | Não existe como superfície v2 formalizada nesta fase; a retaguarda migrada cobre gestão, métricas, faturamento e cancelamento administrativo. |

## Validação focada

- `.\npxw.cmd vitest run src\features\agile-store\services\agile-store-admin-mappers.test.ts app\api\agile-store\route.test.ts src\features\agile-store\components\agile-store-pages.test.tsx`
- `.\npmw.cmd run typecheck`
