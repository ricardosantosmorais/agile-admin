# 08 - Mapa do Repositório

## Visão geral
Estrutura atual observada em `C:\Projetos\admin-v2-web\src` e `C:\Projetos\admin-v2-web\app`.

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

## `src/services/`
Infraestrutura de serviços transversais.

Destaques:
- `src/services/http/http-client.ts`
- `src/services/http/server-api.ts`
- `src/services/http/crud-route.ts`

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
- [app-providers.tsx](/C:/Projetos/admin-v2-web/src/providers/app-providers.tsx)

## `docs/`
Documentação do v2.

Objetivo:
- consolidar arquitetura e fluxos atuais;
- servir de base para onboarding;
- preparar evolução e apresentação do produto.

