# Módulo Ferramentas > Editor SQL

## Escopo atual

Escopo atual migrado para o v2:

- editor SQL em página própria, com experiência baseada em Monaco;
- múltiplas abas de trabalho no mesmo contexto;
- execução contra fontes `Agile e-Commerce`, `AgileSync` e `ERP`;
- tela cheia para ampliar a área útil do editor e do resultado;
- visualização do retorno em tabela ou JSON;
- exportação em CSV e JSON;
- cópia rápida do SQL e do resultado;
- carregamento de consultas salvas;
- salvamento de consultas na API externa legada;
- bridge dedicada em `app/api/editor-sql/*`, sem acoplar a UI diretamente à API externa;
- histórico local por aba, com restore automático por usuário e tenant no navegador;
- persistência local da aba ativa, SQL digitado, fonte, modo de resultado e divisão dos painéis.

## Decisões

- `Editor SQL` não usa `CrudFormPage` nem `CrudListPage`.
- O módulo foi tratado como página operacional própria.
- A integração não passa pela `api-v3`; usa uma API externa específica configurada por ambiente.
- A resolução do tenant segue o contexto autenticado do v2, usando o código da empresa ativa para executar a consulta.
- Para `ERP`, o destino externo respeita a mesma regra do legado:
  - quando `protheus_tipo_integracao=api`, usa `AgileSync`;
  - caso contrário, usa `PainelB2B`.
- O editor usa Monaco para entregar uma experiência mais próxima das ferramentas de mercado.
- O restore do workspace é totalmente local, sem depender de backend adicional neste momento.

## Variáveis de ambiente

Para funcionar localmente, o módulo depende destas variáveis:

- `ADMIN_URL_API_PAINELB2B`
- `ADMIN_API_PAINELB2B_TOKEN`
- `ADMIN_URL_API_AGILESYNC`
- `ADMIN_API_AGILESYNC_TOKEN`

## Cobertura

Cobertura mínima atual:

- unitário:
  - `src/features/editor-sql/services/sql-editor-mappers.test.ts`
  - `src/features/editor-sql/services/sql-editor-workspace.test.ts`
- E2E:
  - `e2e/editor-sql.spec.ts`

## Próxima rodada

- enriquecer os atalhos e o menu de ajuda do editor;
- adicionar formatação SQL no frontend;
- permitir executar apenas o trecho selecionado da consulta;
- evoluir a barra inferior com mais metadados de execução, como tempo e cursor.
