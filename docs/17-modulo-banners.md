# 17 - Módulo Banners

## Objetivo
Registrar a migração de `Marketing > Banners` para o `admin-v2-web`.

## Escopo migrado
- listagem server-side com filtros por ID, área, título, posição, disponibilidade e ativo;
- formulário do banner com abas `Dados gerais`, `Exibição` e `URLs`;
- bridge em `app/api/banners/*` e `app/api/empresas/urls`;
- i18n em `pt-BR` e `en-US`;
- testes unitários dos mapeadores e testes de integração do formulário e da aba de URLs;
- E2E autenticado do fluxo principal via menu `Marketing > Banners`.

## Referência no legado
Arquivos-base analisados:
- `C:\Projetos\admin\components\banners-list.php`
- `C:\Projetos\admin\components\banners-form.php`
- `C:\Projetos\admin\assets\js\components\banners-list.js`
- `C:\Projetos\admin\assets\js\components\banners-form.js`
- `C:\Projetos\admin\controllers\banners-controller.php`
- `C:\Projetos\admin\controllers\banners-urls-controller.php`
- `C:\Projetos\admin\controllers\empresas-urls-controller.php`
- `C:\Projetos\admin\controllers\urls-controller.php`

## Decisão de composição
`Banners` permanece com listagem em `CrudListPage`, mas o formulário foi refatorado para `TabbedCatalogFormPage`.

Essa composição foi necessária porque o legado não é um CRUD linear:
- a aba `Dados gerais` concentra os campos principais do banner;
- a aba `Exibição` gerencia regras de universo;
- a aba `URLs` vincula URLs da empresa ao banner.

## Comportamento mantido
- ordenação e filtros principais da listagem;
- escolha de permissão, perfil e canal de exibição;
- vínculo da área de banner;
- imagens desktop e mobile;
- janela de vigência com data/hora de início e fim;
- posição e título;
- tipo de link com seleção condicional do objeto relacionado;
- preenchimento automático do campo `Link` a partir do objeto selecionado no `Tipo de link`;
- link manual e target;
- cadastro e exclusão de regras de exibição na aba dedicada;
- seleção e persistência das URLs associadas ao banner.

## Ajustes do v2
- o formulário usa lookup assíncrono para objetos relacionados, evitando pré-carregar listas grandes;
- a base compartilhada suporta `datetime-local` em `CrudFormSections`;
- a aba `Exibição` reutiliza a base `CatalogUniversosTab`;
- a aba `URLs` usa tabela selecionável com salvamento local da relação;
- o redirect pós-save segue o fluxo padrão atual do v2.

## Testes
- Unitário: `src/features/banners/services/banners-mappers.test.ts`
- Integração: `src/features/banners/components/banner-form-config.test.tsx`
- Integração: `src/features/banners/components/banner-urls-tab.test.tsx`
- E2E: `e2e/banners.spec.ts`
