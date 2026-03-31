# 05 - Arquitetura Frontend e Padrões

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
- autenticação;
- controle global de sessão;
- tenant corrente.

## Padrão de módulo
Os módulos atuais tendem a seguir este desenho:
- `services/`
  - client
  - mappers
  - config
  - helpers específicos
- `components/`
  - list page
  - form page
  - tabs
  - modais
  - subcomponentes locais
- `types/`
  - tipos específicos quando o módulo pede

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
- módulos muito densos podem ter listagem própria, desde que preservem o padrão visual do v2.

### Formulários
Arquivos principais:
- [../src/components/crud-base/crud-form-page.tsx](../src/components/crud-base/crud-form-page.tsx)
- [../src/components/crud-base/crud-form-sections.tsx](../src/components/crud-base/crud-form-sections.tsx)
- [../src/components/ui/form-row.tsx](../src/components/ui/form-row.tsx)
- [../src/components/ui/section-card.tsx](../src/components/ui/section-card.tsx)

Capacidades atuais:
- seções em linha;
- campos condicionais;
- lookups;
- selects;
- máscaras;
- upload;
- editor HTML;
- validação visual de obrigatórios;
- ação extra no header;
- redirect pós-save configurável.

### Formulários tabulados e híbridos
Nem toda tela deve ser forçada para `CrudFormPage`.

Bases relevantes:
- [../src/features/catalog/components/tabbed-catalog-form-page.tsx](../src/features/catalog/components/tabbed-catalog-form-page.tsx)
- [../src/components/ui/tab-button.tsx](../src/components/ui/tab-button.tsx)

Casos típicos:
- catálogo com abas;
- produtos;
- formas de entrega;
- módulos operacionais com várias relações;
- wizards, como `Produtos x Precificadores`.

## Bridges e integração
Regra atual:
- integrações com a `api-v3` passam preferencialmente por `app/api/*`;
- integrações externas específicas também passam por bridges próprias, por exemplo:
  - `app/api/editor-sql/*`
  - `app/api/uploads/*`

As adaptações de payload, contratos e tratamento de erro devem viver em:
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
- a base já suporta estratégia preparada para S3;
- alguns módulos já usam bridge de upload real;
- o desenho continua compatível com módulos que ainda dependem do fluxo legado.

## Editor HTML
O editor HTML compartilhado continua baseado em Tiptap:
- [../src/components/ui/rich-text-editor.tsx](../src/components/ui/rich-text-editor.tsx)

Direção atual:
- manter Tiptap como base;
- evoluir toolbar e extensões quando necessário;
- evitar trocar de biblioteca sem ganho técnico claro.

## Editor SQL
`Ferramentas > Editor SQL` foi tratado como página operacional própria.

Base relevante:
- [../src/features/editor-sql/components/sql-editor-page.tsx](../src/features/editor-sql/components/sql-editor-page.tsx)
- [../src/features/editor-sql/components/sql-editor-monaco.tsx](../src/features/editor-sql/components/sql-editor-monaco.tsx)
- [../src/features/editor-sql/services/sql-editor-workspace.ts](../src/features/editor-sql/services/sql-editor-workspace.ts)

Padrões adotados:
- Monaco com model por aba;
- persistência local do workspace no navegador;
- múltiplas abas, fullscreen e painéis redimensionáveis;
- resultado em tabela ou JSON;
- sem dependência de backend adicional para restore local.

## i18n
Idiomas atuais:
- `pt-BR`
- `en-US`

Estratégia:
- textos fixos no dicionário local;
- labels de menu vindos da API traduzidos por chave estável e fallback controlado;
- toda string nova de UI deve entrar nos dois dicionários.

## Observabilidade
O projeto possui integração base com Sentry no App Router.

Pontos de entrada:
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `app/global-error.tsx`
- `src/lib/sentry.ts`

Regra:
- observabilidade deve ficar na infraestrutura da aplicação;
- telas não devem espalhar captura manual sem necessidade;
- DSNs client-side usam `NEXT_PUBLIC_SENTRY_DSN`.

## Regra prática de escolha de base
Ao começar um módulo:
1. verificar se é CRUD linear;
2. verificar se precisa de tabs;
3. verificar se é tela operacional densa;
4. escolher a menor base compartilhada que resolva o problema sem esconder regra de negócio real.
