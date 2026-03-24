# 05 - Arquitetura Frontend e Padrões

## Providers
Ordem atual dos providers em [app-providers.tsx](/C:/Projetos/admin-v2-web/src/providers/app-providers.tsx):
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
- `components/`
  - list page
  - form page
  - subcomponentes locais
- `types/`
  - tipos específicos quando o módulo pede

## Bases compartilhadas

### Listagens
Arquivos principais:
- [crud-list-page.tsx](/C:/Projetos/admin-v2-web/src/components/crud-base/crud-list-page.tsx)
- [use-crud-list-controller.ts](/C:/Projetos/admin-v2-web/src/components/crud-base/use-crud-list-controller.ts)
- [app-data-table.tsx](/C:/Projetos/admin-v2-web/src/components/data-table/app-data-table.tsx)
- [data-table-filters.tsx](/C:/Projetos/admin-v2-web/src/components/data-table/data-table-filters.tsx)
- [data-table-toolbar.tsx](/C:/Projetos/admin-v2-web/src/components/data-table/data-table-toolbar.tsx)

Uso ideal:
- CRUDs lineares usam `CrudListPage`;
- telas operacionais complexas usam `AppDataTable` + `useCrudListController`.

### Formulários
Arquivos principais:
- [crud-form-page.tsx](/C:/Projetos/admin-v2-web/src/components/crud-base/crud-form-page.tsx)
- [crud-form-sections.tsx](/C:/Projetos/admin-v2-web/src/components/crud-base/crud-form-sections.tsx)

Capacidades atuais:
- seções em linha;
- campos condicionais;
- lookups;
- selects;
- máscaras;
- upload de imagem;
- editor rico;
- ação extra no header;
- redirect pós-save configurável.

### Formulários híbridos
Alguns módulos não devem ser forçados para `CrudFormPage` puro.

Exemplos:
- clientes;
- vendedores;
- grupos de clientes;
- catálogo com abas;
- produtos x departamentos.

Nesses casos, o padrão adotado é:
- usar `CrudFormSections` nas partes lineares;
- manter seções relacionais e operacionais em componentes próprios.

## Upload de imagem
O v2 já possui componente próprio de upload:
- [image-upload-field.tsx](/C:/Projetos/admin-v2-web/src/components/ui/image-upload-field.tsx)

Estado atual:
- usa `react-dropzone`;
- fluxo local com seleção de arquivo;
- preparado para futura integração com backend/S3.

## Editor rico
O editor atual usa Tiptap:
- [rich-text-editor.tsx](/C:/Projetos/admin-v2-web/src/components/ui/rich-text-editor.tsx)

Recursos já implementados:
- HTML real;
- imagem;
- largura total do card;
- altura mínima e máxima com scroll.

## i18n
O projeto já suporta:
- `pt-BR`
- `en-US`

Estratégia:
- textos fixos no dicionário local;
- labels de menu vindos da API traduzidos por chave estável/fallback;
- sem persistência em banco para idioma.

