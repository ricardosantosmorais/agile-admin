# Admin v2 Web - Design

## Objetivo

Este documento é a porta de entrada para design de produto, UX e UI do `admin-v2-web`.

Use este guia ao criar, migrar ou revisar telas do Admin v2. Ele consolida os critérios visuais e operacionais que aparecem no código e na documentação técnica, sem substituir os documentos especializados em `docs/`.

Leitura complementar:
- [Design System Técnico](./docs/design-system-tecnico.md)
- [Arquitetura Frontend e Padrões](./docs/05-arquitetura-frontend-padroes.md)
- [Catálogo de Componentes Compartilhados](./docs/12-catalogo-componentes-compartilhados.md)
- [Diferenças para o Legado](./docs/07-diferencas-para-o-legado.md)
- [Estratégia de Testes](./docs/10-estrategia-de-testes.md)
- [ADRs](./docs/adr/README.md)

## Princípios de Produto

- O Admin v2 é uma ferramenta operacional B2B. A interface deve ser densa, escaneável e previsível.
- A primeira tela de uma funcionalidade deve ser o fluxo utilizável, não uma landing page ou apresentação comercial.
- Preserve paridade funcional com o legado quando migrar um módulo: regras, permissões, filtros, modais, validações e comportamento operacional importam mais do que copiar HTML antigo.
- Evolua visualmente de forma incremental. Não reestilize uma família inteira de componentes para resolver um ajuste local.
- Prefira componentes compartilhados quando o fluxo for repetível; não force uma base genérica quando a tela for operacional ou densa demais.
- Toda decisão de UI deve funcionar em português, inglês, desktop, mobile, light mode e dark mode.

## Linguagem Visual

A base visual vive em [src/index.css](./src/index.css), detalhada no [Design System Técnico](./docs/design-system-tecnico.md). Use os tokens e classes semânticas existentes antes de criar cores ou superfícies novas.

Padrões atuais:
- fonte principal: `Manrope`;
- superfícies: `app-shell-card-modern`, `app-card-modern`, `app-pane`, `app-pane-muted`, `app-table-shell`;
- controles: `app-control`, `app-control-muted`, `app-input`;
- botões: `app-button-primary`, `app-button-secondary`, `app-button-danger`;
- tabelas: `app-table-shell` e `app-table-muted`;
- destaque e tema: variáveis `--app-*`, com equivalentes para `html[data-theme='dark']`.

Regras práticas:
- Não usar cor hardcoded quando existir token, classe semântica ou componente base equivalente.
- Manter contraste claro entre fundo, card, controle, tabela, modal e dropdown.
- Validar hover, focus, disabled, loading e erro nos dois temas.
- Evitar paleta de uma cor só. O Admin v2 usa uma base neutra com acentos controlados.
- Manter cantos, sombras e espaçamentos consistentes com os componentes existentes, em vez de criar um estilo novo por tela.

## Estrutura de Tela

Telas autenticadas devem parecer parte do mesmo produto:

- `PageHeader` no topo, com breadcrumb e ações principais.
- Listagens com `Atualizar` no header, botão `Filtros` no lado esquerdo do card e `Novo` no lado direito quando aplicável.
- Filtros ocultos por padrão, com campos equivalentes aos filtros importantes do legado.
- Conteúdo principal em `SectionCard` ou base compartilhada equivalente.
- Estados de loading, erro e vazio com `AsyncState`, mensagens claras e sem erro cru de backend quando houver tradução ou normalização possível.
- Feedback de save, erro e sucesso com `PageToast` ou modal apropriado.
- Ações destrutivas com `ConfirmDialog`.
- Modais com `OverlayModal`, scroll interno e bloqueio correto do fundo.

Não duplique título e subtítulo no corpo quando o breadcrumb já comunica a posição da tela. Em telas densas, preserve espaço para a operação.

## Padrões por Tipo de Tela

### CRUD Linear

Use `CrudListPage` e `CrudFormPage` quando a tela for essencialmente listar, criar, editar e excluir registros com formulário linear.

Exemplos esperados:
- cadastros simples;
- tabelas auxiliares;
- formulários sem relações pesadas ou operação própria.

### Formulário Híbrido

Use `CrudFormSections` com seções locais quando a tela tiver uma parte linear reaproveitável, mas também precisar de uma seção específica.

Esse modelo evita duplicar formulário inteiro e também evita esconder regra de negócio dentro de configuração genérica demais.

### Tela Tabulada

Use abas quando existem seções independentes ou relações reais entre dados. Não adicione abas por padrão em formulários que são naturalmente lineares.

Se apenas uma aba for útil, a barra de abas não deve aparecer. Fluxos sequenciais devem preferir `StepIndicator` quando a ordem das etapas fizer parte da experiência.

### Painel Operacional Denso

Use composição própria com `PageHeader`, `SectionCard`, `AppDataTable`, modais, hooks e componentes menores quando a experiência principal não couber em CRUD genérico.

Exemplos de referência:
- clientes;
- vendedores;
- usuários;
- pedidos;
- relatórios;
- ferramentas operacionais.

### Editor e Ferramentas

Ferramentas como o Editor SQL podem usar layout próprio, painéis redimensionáveis, fullscreen e controles compactos, desde que preservem shell, i18n, permissões, estados e tokens visuais do v2.

## Componentes Canônicos

Antes de criar um componente local, verifique se um destes resolve o caso:

- `CrudListPage`: listagem padrão de CRUD linear.
- `CrudFormPage`: formulário padrão de CRUD linear.
- `CrudFormSections`: seções configuráveis de formulário.
- `useCrudListController`: controller de listagem para tela própria.
- `AppDataTable`: tabela responsiva com desktop, mobile, ordenação, seleção, expansão e paginação.
- `DataTableFiltersCard`: filtros embutidos no card de listagem.
- `DataTableToolbar`: ritmo visual de ações como `Filtros`, `Novo` e comandos de página.
- `SectionCard`: superfície base de formulário, seção e bloco operacional.
- `FormRow`: label à esquerda e campo à direita, aproximando a ergonomia operacional do legado.
- `LookupSelect`: autocomplete assíncrono para entidades relacionadas.
- `BooleanSegmentedField` ou `BooleanChoice`: escolha booleana compacta em vez de checkbox cru em telas novas.
- `PageToast`: feedback temporário de erro ou sucesso.
- `AsyncState`: carregando, erro e vazio.
- `ConfirmDialog` e `OverlayModal`: confirmações, modais relacionais e fluxos operacionais.
- `StatusBadge`: estados como ativo, inativo, sim, não, bloqueado e equivalentes.
- `AssetUploadField`, `ImageUploadField` e `FileUploadField`: upload com preview e estratégia preparada para S3.
- `RichTextEditor`, `CodeEditor`, `JsonCodeEditor` e Monaco local da feature: editores ricos ou técnicos.
- `TooltipIconButton`: ações por ícone com nome acessível e tooltip.

Se o componente compartilhado não atender o caso, componha a tela com peças menores e registre a razão no documento do módulo quando a decisão for relevante.

## Migração do Legado

O legado em `C:\Projetos\admin` continua sendo referência funcional para módulos migrados.

Antes de decidir o desenho de uma migração, verifique:
- listagem, filtros e ordenação;
- formulário, campos obrigatórios, máscaras e helper texts;
- modais, abas, dual lists, treeviews e detalhes expansivos;
- permissões de listar, criar, editar, excluir e ações especiais;
- validações e payloads reais;
- comportamento de tenant, empresa selecionada e sessão;
- mensagens, estados e edge cases usados pela operação.

Traga para o v2 a regra de negócio e o fluxo operacional. Não replique acoplamento estrutural antigo, dependências de tela ou padrões visuais que conflitem com o design system atual.

## Responsividade

Todo fluxo visual deve ser pensado para desktop e mobile:

- No desktop, priorize densidade e comparação rápida.
- No mobile, use cards ou composições responsivas já fornecidas por `AppDataTable`.
- Botões e filtros devem quebrar linha sem sobrepor texto ou controles.
- Colunas menos importantes devem usar visibilidade responsiva em vez de esmagar conteúdo.
- Ações por linha devem manter tamanho estável e não deslocar a tabela ao variar quantidade de botões.
- Modais devem ter scroll interno quando o conteúdo passar da altura útil.

Não considere uma tela validada se ela foi conferida apenas em um breakpoint.

## Acessibilidade

O Admin v2 deve ser operável por teclado e legível por leitores de tela sempre que possível.

Regras mínimas:
- campos com label claro;
- foco visível em controles interativos;
- botões de ícone com `aria-label` e tooltip;
- modais bloqueando interação com o fundo;
- ações destrutivas com confirmação textual;
- estados de erro e obrigatoriedade perto do campo quando o usuário precisa corrigir input;
- sem depender apenas de cor para comunicar estado.

Prefira semântica HTML correta antes de adicionar ARIA manual.

## i18n, Texto e Encoding

Toda string nova visível ao usuário deve entrar em:
- [src/i18n/dictionaries/pt-BR.ts](./src/i18n/dictionaries/pt-BR.ts)
- [src/i18n/dictionaries/en-US.ts](./src/i18n/dictionaries/en-US.ts)

Regras:
- português do Brasil com acentuação correta;
- inglês consistente com a mesma intenção de UX;
- sem fallback hardcoded em português em telas traduzíveis;
- sem chave literal aparecendo na tela;
- sem mojibake, `?` substituindo acento ou texto parcialmente corrompido;
- helper text do legado deve ser preservado quando explicar regra operacional real.

Ao mexer em docs, labels, menus, dicionários ou texto visível, revise encoding no arquivo alterado antes de concluir.

## Checklist de Revisão Visual

Antes de concluir uma tela, componente compartilhado ou migração:

- O fluxo principal funciona em PT e EN.
- Light mode e dark mode mantêm contraste em fundo, card, campo, tabela, modal e dropdown.
- Desktop e mobile não apresentam sobreposição, truncamento ruim ou botões quebrados.
- Loading, vazio, erro, sucesso, disabled, hover e focus foram considerados.
- Breadcrumb, toolbar, filtros, tabela e formulário seguem o padrão atual.
- Permissões de listar, criar, editar, excluir e ações especiais foram respeitadas.
- Strings novas estão nos dois dicionários.
- Acentos e caracteres especiais renderizam corretamente.
- O componente compartilhado não sofreu alteração ampla sem validar pelo menos um fluxo de listagem e um de formulário.
- A diferença para o legado está documentada quando houver mudança funcional real.

## Quando Atualizar Este Documento

Atualize este arquivo quando:
- surgir um novo padrão visual transversal;
- um componente compartilhado mudar a forma recomendada de montar telas;
- uma decisão de UX passar a orientar várias features;
- uma migração revelar regra de design que deve ser reaproveitada;
- houver mudança relevante em tema, responsividade, acessibilidade ou i18n.

Se a mudança for puramente técnica, prefira atualizar `docs/`, o documento do módulo ou um ADR.
