# 33 - Módulo Ferramentas > Editor SQL

## Escopo atual
Escopo atual migrado para o v2:

- editor SQL em página própria, com experiência baseada em Monaco;
- múltiplas abas de trabalho no mesmo contexto;
- execução contra fontes `Agile e-Commerce`, `AgileSync` e `ERP`;
- fullscreen para ampliar o workspace;
- editor e resultado em painéis redimensionáveis;
- visualização do retorno em tabela ou JSON;
- exportação em CSV e JSON;
- cópia rápida do SQL e do resultado;
- carregamento e salvamento de consultas na API externa legada;
- persistência local do workspace no navegador, por usuário e tenant;
- restore de abas, SQL, fonte de dados, modo do resultado, divisão dos painéis e último resultado da aba.

## Decisões
- `Editor SQL` não usa `CrudFormPage` nem `CrudListPage`;
- o módulo foi tratado como página operacional própria;
- a integração não passa pela `api-v3`; usa APIs externas específicas configuradas por ambiente;
- o tenant ativo continua sendo resolvido pelo contexto autenticado do v2;
- para execução de SQL, inclusive fonte `ERP`, o destino externo segue o legado atual e usa sempre o `PainelB2BApi`;
- o restore do workspace é totalmente local, sem depender de backend adicional;
- o autocomplete mais agressivo foi desabilitado por enquanto para priorizar fluidez do editor; as sugestões continuam disponíveis manualmente por `Ctrl+Space`.

## Base técnica principal
- [../src/features/editor-sql/components/sql-editor-page.tsx](../src/features/editor-sql/components/sql-editor-page.tsx)
- [../src/features/editor-sql/components/sql-editor-monaco.tsx](../src/features/editor-sql/components/sql-editor-monaco.tsx)
- [../src/features/editor-sql/services/sql-editor-client.ts](../src/features/editor-sql/services/sql-editor-client.ts)
- [../src/features/editor-sql/services/sql-editor-workspace.ts](../src/features/editor-sql/services/sql-editor-workspace.ts)
- [../app/api/editor-sql/execute/route.ts](../app/api/editor-sql/execute/route.ts)
- [../app/api/editor-sql/queries/route.ts](../app/api/editor-sql/queries/route.ts)

## Variáveis de ambiente
Para funcionar localmente, o módulo depende destas variáveis:

- `ADMIN_URL_API_PAINELB2B`
- `ADMIN_API_PAINELB2B_TOKEN`

## Cobertura
Cobertura mínima atual:

- unitário:
  - `src/features/editor-sql/services/sql-editor-mappers.test.ts`
  - `src/features/editor-sql/services/sql-editor-workspace.test.ts`
- E2E:
  - `e2e/editor-sql.spec.ts`

## Próximas evoluções no frontend
- formatação SQL por ação explícita;
- executar apenas a seleção atual;
- renomear e duplicar abas;
- enriquecer a status bar com mais metadados de execução, sem reintroduzir flicker na digitação.
