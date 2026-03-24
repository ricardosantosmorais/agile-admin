# 12 - Catalogo de Componentes Compartilhados

## Objetivo
Este documento descreve os componentes compartilhados do `admin-v2-web`, quando devem ser usados e quando nao faz sentido forcar seu uso.

O objetivo nao e listar arquivo por arquivo sem contexto. O foco aqui e registrar o papel de cada base compartilhada dentro da arquitetura atual.

## Principio geral
O projeto usa tres niveis de composicao:

1. bases genericas para CRUDs lineares;
2. bases especializadas para listagem e catalogo;
3. paginas proprias para fluxos operacionais mais densos.

Esse criterio evita dois extremos:
- duplicar comportamento em cada tela;
- tentar encaixar telas complexas em um componente generico demais.

## Shell e navegacao

### `PageHeader`
Arquivo: [page-header.tsx](/C:/Projetos/admin-v2-web/src/components/ui/page-header.tsx)

Responsabilidade:
- breadcrumb;
- acoes de topo;
- barra padrao de pagina.

Uso:
- formularios;
- listagens;
- paginas de detalhe;
- fluxos de senha.

Regra:
- em listagens, o breadcrumb substitui titulo e subtitulo duplicados no corpo;
- em formularios, acoes como `Voltar`, `Salvar` contextual e `Alterar senha` podem viver aqui.

### `Topbar`
Arquivo: [topbar.tsx](/C:/Projetos/admin-v2-web/src/components/shell/topbar.tsx)

Responsabilidade:
- troca de tenant;
- busca rapida;
- seletor de idioma;
- acoes globais do usuario.

### `Sidebar`
Arquivo: [sidebar.tsx](/C:/Projetos/admin-v2-web/src/components/shell/sidebar.tsx)

Responsabilidade:
- menu principal;
- expansao de grupos;
- destaque da rota ativa.

Regras atuais:
- apenas um submenu aberto por vez;
- itens de nivel 1 usam a mesma tipografia, com ou sem submenu;
- os icones sao mapeados do legado para o conjunto atual de icones do v2.

## Base de listagem

### `AppDataTable`
Arquivo: [app-data-table.tsx](/C:/Projetos/admin-v2-web/src/components/data-table/app-data-table.tsx)

Responsabilidade:
- tabela desktop;
- versao mobile;
- ordenacao;
- paginacao;
- selecao;
- linha expansivel;
- acoes por linha;
- seletor de itens por pagina no rodape.

Uso recomendado:
- qualquer tela com listagem padrao server-side.

Nao tentar usar para:
- telas que sao mais painel operacional do que listagem;
- fluxos de arvore, dual list ou composicoes muito especificas.

### `DataTableFilters`
Arquivo: [data-table-filters.tsx](/C:/Projetos/admin-v2-web/src/components/data-table/data-table-filters.tsx)

Responsabilidade:
- renderizar os filtros embutidos no card da listagem;
- manter o estado recolhido por padrao;
- usar campos de filtro definidos pela propria tela.

Padrao atual:
- botao de filtros no lado esquerdo do cabecalho do card;
- sem titulo duplicado de listagem;
- filtros ocultos por padrao.

### `DataTableToolbar`
Arquivo: [data-table-toolbar.tsx](/C:/Projetos/admin-v2-web/src/components/data-table/data-table-toolbar.tsx)

Responsabilidade:
- organizar botoes de listagem;
- manter altura e ritmo visual iguais para `Filtros`, `Novo` e outras acoes.

### `useDataTableState`
Arquivo: [use-data-table-state.ts](/C:/Projetos/admin-v2-web/src/components/data-table/use-data-table-state.ts)

Responsabilidade:
- selecao de linhas;
- selecao total;
- expansao de linhas;
- troca de pagina;
- ordenacao;
- limpeza de selecao.

Uso:
- quando a pagina usa `AppDataTable` mas precisa de controle explicito do estado da tabela.

## Base generica de CRUD

### `CrudListPage`
Arquivo: [crud-list-page.tsx](/C:/Projetos/admin-v2-web/src/components/crud-base/crud-list-page.tsx)

Responsabilidade:
- compor `PageHeader`, card de listagem, filtros e `AppDataTable`;
- aplicar o padrao global de listagem em CRUDs simples.

Use quando:
- a tela e basicamente uma listagem com filtros, exclusao e navegacao para criar/editar.

Nao use quando:
- a tela depende de modais operacionais densos;
- a tela tem regras de listagem muito especificas;
- a experiencia principal nao e um CRUD simples.

### `CrudFormPage`
Arquivo: [crud-form-page.tsx](/C:/Projetos/admin-v2-web/src/components/crud-base/crud-form-page.tsx)

Responsabilidade:
- carregar registro;
- renderizar formulario linear;
- salvar;
- navegar apos criar/editar;
- exibir `Salvar` no topo quando o rodape nao esta visivel;
- integrar toasts e estado assinc.

Use quando:
- o formulario e linear;
- os campos podem ser descritos por configuracao;
- a pagina nao precisa de abas relacionais pesadas.

Nao use quando:
- existem varias abas com comportamentos proprios;
- a tela concentra modais, tabelas relacionais e logica operacional forte.

### `CrudFormSections`
Arquivo: [crud-form-sections.tsx](/C:/Projetos/admin-v2-web/src/components/crud-base/crud-form-sections.tsx)

Responsabilidade:
- renderizar secoes de formulario a partir de configuracao;
- suportar campos como texto, select, lookup, `datetime-local`, html, imagem e icone;
- servir de meio-termo entre formulario generico e pagina totalmente manual.

Uso recomendado:
- formularios hibridos;
- telas em que a parte linear pode ser componentizada, mas ainda existe uma secao relacional separada.

Exemplo atual:
- `Grupos de Clientes`.

### `useCrudListController`
Arquivo: [use-crud-list-controller.ts](/C:/Projetos/admin-v2-web/src/components/crud-base/use-crud-list-controller.ts)

Responsabilidade:
- persistencia de filtros;
- carregamento da lista;
- refresh;
- exclusao;
- pagina, ordenacao e selecao.

Uso:
- telas proprias que nao querem usar `CrudListPage` inteiro, mas ainda podem reaproveitar o controller.

Exemplos atuais:
- `Administradores`;
- `Usuarios`.

## Base especializada de catalogo

### `TabbedCatalogFormPage`
Arquivo: [tabbed-catalog-form-page.tsx](/C:/Projetos/admin-v2-web/src/features/catalog/components/tabbed-catalog-form-page.tsx)

Responsabilidade:
- formularios de catalogo com abas;
- composicao entre secoes lineares e abas relacionais.

Uso atual:
- `Colecoes`;
- `Listas`;
- `Marcas`;
- `Departamentos`;
- `Grades`.

Regra:
- se so houver uma aba util, a barra de abas nao deve aparecer.

### `CatalogProductsTab`
Arquivo: [catalog-products-tab.tsx](/C:/Projetos/admin-v2-web/src/features/catalog/components/catalog-products-tab.tsx)

Responsabilidade:
- relacionamento entre entidade de catalogo e produtos;
- inclusao, ordenacao e exclusao.

Uso atual:
- `Colecoes`;
- `Listas`.

## Componentes de formulario

### `LookupSelect`
Arquivo: [lookup-select.tsx](/C:/Projetos/admin-v2-web/src/components/ui/lookup-select.tsx)

Responsabilidade:
- autocomplete assinc para entidades relacionadas.

Uso:
- filial;
- departamento pai;
- produto;
- vendedor;
- tabela de preco;
- demais lookups.

### `BooleanChoice`
Arquivo: [boolean-choice.tsx](/C:/Projetos/admin-v2-web/src/components/ui/boolean-choice.tsx)

Responsabilidade:
- escolha booleana compacta no estilo `Sim / Nao`.

Padrao atual:
- substitui checkbox e switch nos formularios novos.

### `FormRow`
Arquivo: [form-row.tsx](/C:/Projetos/admin-v2-web/src/components/ui/form-row.tsx)

Responsabilidade:
- linha de formulario com label a esquerda e campo a direita;
- padrao usado para aproximar a ergonomia do legado.

### `FormField`
Arquivo: [form-field.tsx](/C:/Projetos/admin-v2-web/src/components/ui/form-field.tsx)

Responsabilidade:
- invólucro simples de label, ajuda e erro quando a tela nao esta em layout de linha.

### `RichTextEditor`
Arquivo: [rich-text-editor.tsx](/C:/Projetos/admin-v2-web/src/components/ui/rich-text-editor.tsx)

Responsabilidade:
- editor HTML do v2;
- toolbar;
- suporte a imagem por caminho e base64;
- altura minima confortavel e altura maxima com scroll.

Uso atual:
- `Paginas`;
- campos HTML de catalogo quando necessario.

### `ImageUploadField`
Arquivo: [image-upload-field.tsx](/C:/Projetos/admin-v2-web/src/components/ui/image-upload-field.tsx)

Responsabilidade:
- upload de imagem no front;
- preview;
- area de drop com `react-dropzone`;
- integracao atual via `base64`;
- preparada para estrategia futura com S3.

Uso atual:
- `Departamentos`;
- `Listas`;
- `Colecoes`;
- `Marcas`;
- outras telas com `type: 'image'`.

### `IconPickerField`
Arquivo: [icon-picker-field.tsx](/C:/Projetos/admin-v2-web/src/components/ui/icon-picker-field.tsx)

Responsabilidade:
- permitir escolher um icone do sistema;
- ou usar imagem no mesmo campo, conforme o modulo.

Uso atual:
- `Departamentos`.

## Componentes de feedback e bloqueio

### `PageToast`
Arquivo: [page-toast.tsx](/C:/Projetos/admin-v2-web/src/components/ui/page-toast.tsx)

Responsabilidade:
- mensagem temporaria de erro ou sucesso no topo da pagina;
- substitui cards fixos de erro apos save.

### `AsyncState`
Arquivo: [async-state.tsx](/C:/Projetos/admin-v2-web/src/components/ui/async-state.tsx)

Responsabilidade:
- padrao de carregando, vazio e erro.

### `ConfirmDialog`
Arquivo: [confirm-dialog.tsx](/C:/Projetos/admin-v2-web/src/components/ui/confirm-dialog.tsx)

Responsabilidade:
- confirmacoes de exclusao e acoes destrutivas.

### `OverlayModal`
Arquivo: [overlay-modal.tsx](/C:/Projetos/admin-v2-web/src/components/ui/overlay-modal.tsx)

Responsabilidade:
- modal base;
- bloqueio de scroll do fundo;
- scroll interno quando o conteudo excede a altura.

Uso atual:
- modais relacionais;
- modais operacionais;
- fluxos de sessao.

## Componentes de sessao e seguranca

### `PasswordRulesFeedback`
Arquivo: [password-rules-feedback.tsx](/C:/Projetos/admin-v2-web/src/components/ui/password-rules-feedback.tsx)

Responsabilidade:
- feedback em tempo real para politica de senha;
- regras compartilhadas entre modulos.

Uso atual:
- `Usuarios`;
- `Administradores`.

## Componentes de apresentacao

### `SectionCard`
Arquivo: [section-card.tsx](/C:/Projetos/admin-v2-web/src/components/ui/section-card.tsx)

Responsabilidade:
- card base para secoes e formularios;
- padrao de padding e respiro visual.

### `StatusBadge`
Arquivo: [status-badge.tsx](/C:/Projetos/admin-v2-web/src/components/ui/status-badge.tsx)

Responsabilidade:
- badge padronizada para estados como `Sim/Não`, `Ativo/Inativo` e equivalentes.

### `StatCard`
Arquivo: [stat-card.tsx](/C:/Projetos/admin-v2-web/src/components/ui/stat-card.tsx)

Responsabilidade:
- cards de indicadores do dashboard.

## Como decidir qual base usar

### Caso 1: CRUD simples
Use:
- `CrudListPage`
- `CrudFormPage`

Exemplos:
- `Linhas`;
- `Cores`;
- `Areas de Banner`;
- `Emails`.

### Caso 2: formulario hibrido
Use:
- `CrudFormSections`
- secoes ou relacoes locais da feature

Exemplo:
- `Grupos de Clientes`.

### Caso 3: catalogo com abas
Use:
- `TabbedCatalogFormPage`
- abas especializadas do catalogo

Exemplos:
- `Colecoes`;
- `Listas`;
- `Marcas`;
- `Departamentos`;
- `Grades`.

### Caso 4: tela operacional densa
Use:
- `PageHeader`
- `SectionCard`
- `AppDataTable`
- `OverlayModal`
- `ConfirmDialog`
- hooks e componentes menores

Nao tente encaixar a tela em `CrudFormPage` por obrigacao.

Exemplos:
- `Clientes`;
- `Vendedores`;
- `Usuarios`;
- `Produtos x Departamentos`.

## Regra arquitetural atual
Componentizacao nao significa transformar tudo em uma unica base generica.

O criterio correto do projeto hoje e:
- reaproveitar infraestrutura;
- manter a feature dona da propria regra de negocio;
- extrair componentes quando a repeticao e real;
- evitar que a base compartilhada passe a conhecer detalhes de um modulo especifico.

Esse criterio foi adotado justamente para o v2 nao repetir o acoplamento estrutural do legado.
