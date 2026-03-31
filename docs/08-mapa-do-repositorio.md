# 08 - Mapa do Repositório

## Visão geral
Estrutura atual observada em `../src` e `../app`.

## `app/`
Responsável por:
- rotas do App Router;
- layouts protegidos;
- páginas públicas e privadas;
- bridges de backend em `app/api/*`.

Principais grupos:
- `app/(protected)/...`
  - páginas autenticadas;
- `app/login/...`
  - autenticação;
- `app/api/...`
  - endpoints de sessão, CRUD e integrações locais.

## `src/components/`
Camada de componentes reutilizáveis.

Subgrupos mais relevantes:
- `src/components/crud-base/`
  - infraestrutura de listas e formulários lineares;
- `src/components/data-table/`
  - tabela, filtros, toolbar, persistência e controller;
- `src/components/shell/`
  - topbar, sidebar e estrutura visual principal;
- `src/components/ui/`
  - componentes de uso transversal, como modal, toasts, badges, upload e editor.

## `src/contexts/`
Contexts globais da aplicação:
- `auth-context`
- `tenant-context`
- `session-lifecycle-context`
- `ui-context`

## `src/features/`
Organização por domínio.

Padrão esperado por feature:
- `components/`
- `services/`
- `types/`

Exemplos:
- `clientes`
- `usuarios`
- `vendedores`
- `administradores`
- `colecoes`
- `departamentos`
- `produtos`
- `pedidos`
- `editor-sql`

Exemplos recentes com estrutura própria:
- `src/features/produtos/`
  - página tabulada com seções lineares e abas relacionais;
- `src/features/pedidos/`
  - listagem operacional e detalhe denso;
- `src/features/editor-sql/`
  - página operacional com Monaco, workspace local e integrações externas.

## `src/services/`
Infraestrutura de serviços transversais.

Destaques:
- `src/services/http/http-client.ts`
- `src/services/http/server-api.ts`
- `src/services/http/crud-route.ts`
- `src/services/http/external-admin-api.ts`

## `src/i18n/`
Infraestrutura de idioma:
- config;
- provider/context;
- dicionários;
- helpers de tradução do menu.

## `src/lib/`
Utilitários e helpers puros:
- máscaras;
- validadores;
- formatação;
- upload;
- constantes compartilhadas.

## `src/providers/`
Encadeamento de providers globais da aplicação.

Arquivo principal:
- [app-providers.tsx](../src/providers/app-providers.tsx)

## `docs/`
Documentação do v2.

Objetivo:
- consolidar arquitetura e fluxos atuais;
- servir de base para onboarding;
- preparar evolução e apresentação do produto.

Documentos de módulo mais recentes:
- [31 - Módulo Produtos](./31-modulo-produtos.md)
- [32 - Módulo Pedidos](./32-modulo-pedidos.md)
- [33 - Módulo Ferramentas > Editor SQL](./33-modulo-ferramentas-editor-sql.md)
