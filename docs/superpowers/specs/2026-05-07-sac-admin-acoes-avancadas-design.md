# SAC admin ações avançadas - design

## Contexto

O legado do SAC libera ações operacionais por permissões finas do perfil:

- `SAC_FUNC_LISTAR_TODOS`;
- `SAC_FUNC_NOTA_INTERNA`;
- `SAC_FUNC_ALTERAR_STATUS`;
- `SAC_FUNC_ATRIBUIR_RESPONSAVEL`;
- `SAC_FUNC_TRANSFERIR`.

O menu da empresa é dinâmico, vem do banco e segue o controle de acesso por perfil. A migração não deve adicionar módulos fixos no menu; deve apenas garantir que a rota/componente do v2 funcione quando o menu recebido apontar para SAC.

## Decisão

Evoluir a página operacional `/sac` em vez de criar uma nova base CRUD:

- manter bridges locais em `app/api/sac/*`;
- carregar lookups de áreas, assuntos e usuários pela API v3;
- aplicar filtros relacionais na listagem;
- restringir a listagem ao usuário atual quando o perfil não tiver `SAC_FUNC_LISTAR_TODOS`;
- expor nota interna, alteração de status, atribuição e transferência no modal de detalhe;
- enviar `updated_at` em todas as ações, igual ao legado.

## Fora do escopo

- cadastros de áreas;
- cadastros de assuntos;
- configurações do módulo SAC;
- upload completo de anexos;
- backoffice administrativo da Agile Store.
