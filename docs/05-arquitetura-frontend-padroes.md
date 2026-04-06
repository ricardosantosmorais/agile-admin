# 05 - Arquitetura Frontend e PadrÃµes

## Providers
Ordem atual dos providers em [../src/providers/app-providers.tsx](../src/providers/app-providers.tsx):
1. `I18nProvider`
2. `UiProvider`
3. `AuthProvider`
4. `SessionLifecycleProvider`
5. `TenantProvider`

Essa ordem define:
- idioma;
- estado visual;
- autenticaÃ§Ã£o;
- controle global de sessÃ£o;
- tenant corrente.

## Shell responsiva
Base relevante:
- [../src/layouts/auth-shell.tsx](../src/layouts/auth-shell.tsx)
- [../src/components/shell/topbar.tsx](../src/components/shell/topbar.tsx)
- [../src/components/shell/sidebar.tsx](../src/components/shell/sidebar.tsx)
- [../src/contexts/ui-context.tsx](../src/contexts/ui-context.tsx)

PadrÃ£o atual:
- no desktop, a sidebar fica fixa na lateral e a topbar expÃµe o acesso rÃ¡pido;
- no mobile, o botÃ£o hambÃºrguer abre um drawer lateral com o menu;
- no mobile, o campo de acesso rÃ¡pido fica oculto para preservar espaÃ§o Ãºtil;
- a topbar deve priorizar tenant, aÃ§Ãµes essenciais e legibilidade, sem quebrar o layout.

## PadrÃ£o de mÃ³dulo
Os mÃ³dulos atuais tendem a seguir este desenho:
- `services/`
  - client
  - mappers
  - config
  - helpers especÃ­ficos
- `components/`
  - list page
  - form page
  - tabs
  - modais
  - subcomponentes locais
- `types/`
  - tipos especÃ­ficos quando o mÃ³dulo pede

Em `ConfiguraÃ§Ãµes`, o padrÃ£o atual passou a ser organizado por mÃ³dulo:
- `src/features/configuracoes-<modulo>/components`
- `src/features/configuracoes-<modulo>/services`
- `src/features/configuracoes-<modulo>/types`
- peÃ§as reutilizadas entre mÃ³dulos ficam em `src/components/form-page/* e src/lib/company-parameters-query.ts`

## Bases compartilhadas

### Listagens
Arquivos principais:
- [../src/components/crud-base/crud-list-page.tsx](../src/components/crud-base/crud-list-page.tsx)
- [../src/components/crud-base/use-crud-list-controller.ts](../src/components/crud-base/use-crud-list-controller.ts)
- [../src/components/data-table/app-data-table.tsx](../src/components/data-table/app-data-table.tsx)
- [../src/components/data-table/data-table-filters.tsx](../src/components/data-table/data-table-filters.tsx)
- [../src/components/data-table/data-table-toolbar.tsx](../src/components/data-table/data-table-toolbar.tsx)

Uso ideal:
- CRUDs lineares usam `CrudListPage`;
- telas operacionais complexas usam `AppDataTable` e `useCrudListController`;
- mÃ³dulos muito densos podem ter listagem prÃ³pria, desde que preservem o padrÃ£o visual do v2.

### FormulÃ¡rios
Arquivos principais:
- [../src/components/crud-base/crud-form-page.tsx](../src/components/crud-base/crud-form-page.tsx)
- [../src/components/crud-base/crud-form-sections.tsx](../src/components/crud-base/crud-form-sections.tsx)
- [../src/components/ui/form-row.tsx](../src/components/ui/form-row.tsx)
- [../src/components/ui/section-card.tsx](../src/components/ui/section-card.tsx)

Capacidades atuais:
- seÃ§Ãµes em linha;
- campos condicionais;
- lookups;
- selects;
- mÃ¡scaras;
- upload;
- editor HTML;
- validaÃ§Ã£o visual de obrigatÃ³rios;
- aÃ§Ã£o extra no header;
- redirect pÃ³s-save configurÃ¡vel.

### FormulÃ¡rios tabulados e hÃ­bridos
Nem toda tela deve ser forÃ§ada para `CrudFormPage`.

Bases relevantes:
- [../src/features/catalog/components/tabbed-catalog-form-page.tsx](../src/features/catalog/components/tabbed-catalog-form-page.tsx)
- [../src/components/ui/tab-button.tsx](../src/components/ui/tab-button.tsx)

Casos tÃ­picos:
- catÃ¡logo com abas;
- produtos;
- formas de entrega;
- mÃ³dulos operacionais com vÃ¡rias relaÃ§Ãµes;
- wizards, como `Produtos x Precificadores`.

## Bridges e integraÃ§Ã£o
Regra atual:
- integraÃ§Ãµes com a `api-v3` passam preferencialmente por `app/api/*`;
- integraÃ§Ãµes externas especÃ­ficas tambÃ©m passam por bridges prÃ³prias, por exemplo:
  - `app/api/editor-sql/*`
  - `app/api/uploads/*`

As adaptaÃ§Ãµes de payload, contratos e tratamento de erro devem viver em:
- route handlers;
- clients da feature;
- mappers da feature;
- helpers compartilhados.

## Upload e assets
Base compartilhada atual:
- [../src/components/ui/asset-upload-field.tsx](../src/components/ui/asset-upload-field.tsx)
- [../src/components/ui/image-upload-field.tsx](../src/components/ui/image-upload-field.tsx)
- [../src/components/ui/file-upload-field.tsx](../src/components/ui/file-upload-field.tsx)
- [../src/lib/uploads.ts](../src/lib/uploads.ts)
- [../src/lib/upload-targets.ts](../src/lib/upload-targets.ts)
- [../src/lib/upload-profiles.ts](../src/lib/upload-profiles.ts)
- [../app/api/uploads/route.ts](../app/api/uploads/route.ts)

Estado atual:
- a base jÃ¡ suporta estratÃ©gia preparada para S3;
- alguns mÃ³dulos jÃ¡ usam bridge de upload real;
- o desenho continua compatÃ­vel com mÃ³dulos que ainda dependem do fluxo legado.

## Editor HTML
O editor HTML compartilhado continua baseado em Tiptap:
- [../src/components/ui/rich-text-editor.tsx](../src/components/ui/rich-text-editor.tsx)

DireÃ§Ã£o atual:
- manter Tiptap como base;
- evoluir toolbar e extensÃµes quando necessÃ¡rio;
- evitar trocar de biblioteca sem ganho tÃ©cnico claro.

## Editor SQL
`Ferramentas > Editor SQL` foi tratado como pÃ¡gina operacional prÃ³pria.

Base relevante:
- [../src/features/editor-sql/components/sql-editor-page.tsx](../src/features/editor-sql/components/sql-editor-page.tsx)
- [../src/features/editor-sql/components/sql-editor-monaco.tsx](../src/features/editor-sql/components/sql-editor-monaco.tsx)
- [../src/features/editor-sql/services/sql-editor-workspace.ts](../src/features/editor-sql/services/sql-editor-workspace.ts)

PadrÃµes adotados:
- Monaco com model por aba;
- persistÃªncia local do workspace no navegador;
- mÃºltiplas abas, fullscreen e painÃ©is redimensionÃ¡veis;
- resultado em tabela ou JSON;
- sem dependÃªncia de backend adicional para restore local.

## i18n
Idiomas atuais:
- `pt-BR`
- `en-US`

EstratÃ©gia:
- textos fixos no dicionÃ¡rio local;
- labels de menu vindos da API traduzidos por chave estÃ¡vel e fallback controlado;
- toda string nova de UI deve entrar nos dois dicionÃ¡rios.

## Observabilidade
O projeto possui integraÃ§Ã£o base com Sentry no App Router.

Pontos de entrada:
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `app/global-error.tsx`
- `src/lib/sentry.ts`

Regra:
- observabilidade deve ficar na infraestrutura da aplicaÃ§Ã£o;
- telas nÃ£o devem espalhar captura manual sem necessidade;
- DSNs client-side usam `NEXT_PUBLIC_SENTRY_DSN`.

## Regra prÃ¡tica de escolha de base
Ao comeÃ§ar um mÃ³dulo:
1. verificar se Ã© CRUD linear;
2. verificar se precisa de tabs;
3. verificar se Ã© tela operacional densa;
4. escolher a menor base compartilhada que resolva o problema sem esconder regra de negÃ³cio real.


