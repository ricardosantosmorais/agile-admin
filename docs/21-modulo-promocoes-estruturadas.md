# 21 - Módulo Promoções Estruturadas

## Escopo migrado

`Promoções` recebeu no `admin-v2-web` a migração dos módulos:

- `Grupos de Combos`
- `Leve e Pague`
- `Desconto na Unidade`
- `Compre Junto`
- `Compre e Ganhe`

O objetivo desta rodada foi fechar o menu de promoções mantendo o comportamento funcional do legado, mas seguindo a arquitetura atual do v2:

- listagens server-side com `CrudListPage`
- formulários no padrão visual do v2
- abas relacionais em `TabbedCatalogFormPage` quando o fluxo exige módulos auxiliares
- bridges via `app/api/*`
- i18n PT-BR/EN-US
- cobertura mínima com testes unitários, integração leve e E2E

## Referência analisada no legado

Base usada para comparação:

- `components/promocoes-grupos-list.php`
- `components/promocoes-grupos-form.php`
- `components/campanhas-list.php`
- `components/campanhas-form.php`
- `components/brindes-list.php`
- `components/brindes-form.php`
- `controllers/promocoes-grupos-controller.php`
- `controllers/campanhas-controller.php`
- `controllers/brindes-controller.php`
- `assets/js/components/campanhas-form.js`
- `assets/js/components/brindes-form.js`

Na API real, a distribuição técnica dos recursos ficou assim:

- `grupos_promocao` para `Grupos de Combos`
- `campanhas` para `Leve e Pague`, `Desconto na Unidade` e `Compre Junto`
- `compre_ganhe` para `Compre e Ganhe`

## Estrutura no v2

### Grupos de Combos

Fluxo simples de CRUD com:

- listagem por `ID`, `Código`, `Nome` e `Ativo`
- formulário com `Ativo`, `Código`, `Nome`, `Imagem` e `Descrição`

O recurso mantém a função do legado de agrupar promoções e campanhas sem introduzir regra adicional no frontend.

### Leve e Pague

Fluxo com duas abas:

1. `Dados gerais`
2. `Produtos`

Na aba `Produtos`, o v2 agora aceita:

- lista manual por `ID` ou `código`
- busca por autocomplete no mesmo modal

Antes do POST, o frontend resolve códigos digitados para `id_produto`, mantendo o contrato de escrita da API.

Campos principais migrados:

- `Ativo`
- `Código`
- `Nome`
- `Leve`
- `Pague`
- `Quantidade máxima`
- `Data início`
- `Data fim`

Validações aplicadas:

- nome obrigatório
- `Leve >= 2`
- `Pague >= 1`
- `Pague < Leve`
- data final maior ou igual à inicial

### Desconto na Unidade

Fluxo também organizado em:

1. `Dados gerais`
2. `Produtos`

Campos principais migrados:

- `Ativo`
- `Código`
- `Nome`
- `Quantidade`
- `Desconto`
- `Quantidade máxima`
- `Data início`
- `Data fim`

Validações aplicadas:

- nome obrigatório
- quantidade obrigatória
- desconto obrigatório
- data final maior ou igual à inicial

### Compre Junto

Fluxo em abas:

1. `Dados gerais`
2. `Produtos`

O cadastro principal mantém:

- `Ativo`
- `Código`
- `Nome`
- `Data início`
- `Data fim`

A aba `Produtos` migra o comportamento operacional do legado com:

- definição de produto principal
- indicador de aplicação de tributos
- produto alvo
- tipo do desconto (`percentual` ou `valor_fixo`)
- valor

O v2 mantém a regra de apenas um produto principal por campanha no fluxo de criação da relação.

### Compre e Ganhe

Fluxo migrado com cinco abas:

1. `Dados gerais`
2. `Regras`
3. `Produtos`
4. `Exceções`
5. `Restrições`

Campos do cadastro principal:

- `Ativo`
- `Gera pedido`
- `Código`
- `Nome`
- `Descrição`
- `Perfil`
- `Grupo de promoções`
- `Máximo brindes`
- `Quantidade máxima clientes`
- `Data início`
- `Data fim`
- `Imagem`
- `Imagem mobile`

Abas relacionais migradas:

- `Regras`: produto pai, produto, departamento, fornecedor e coleção, com embalagem dinâmica por produto e valores monetários mascarados
- `Produtos`: vínculo do item de brinde por regra, com embalagem dinâmica por produto
- `Exceções` e `Restrições`: universos operacionais do legado, como cliente, filial, grupo, praça, rede, segmento, supervisor, tabela de preço, tipo de cliente, UF, vendedor e todos

## Bridges e contratos

As bridges adicionadas no App Router foram:

- `app/api/grupos-combos/*`
- `app/api/campanhas/*`
- `app/api/compre-e-ganhe/*`

Diretrizes mantidas:

- nenhuma tela consome `api-v3` diretamente
- normalização de datas fica em mapeadores da feature
- adaptação de payload não fica espalhada na UI
- `Compre e Ganhe` envia `id_sync` nas relações de regras e produtos, como no legado
- o GET individual de `Compre e Ganhe` enriquece o grupo promocional para exibir nome amigável no formulário

## Cobertura de testes

Cobertura incluída nesta migração:

- testes unitários para mapeadores de `Grupos de Combos`, `Campanhas` e `Compre e Ganhe`
- testes de integração leve para abas com comportamento condicional
- specs E2E do fluxo feliz principal para cada tela migrada

Nos formulários com abas, os specs E2E validam o carregamento explícito das abas relacionais após a criação do cadastro principal.

## Pendências conhecidas

- `Desconto na Unidade` ainda mantém a vinculação de produtos por lista manual, seguindo o contrato observado no legado; uma UX equivalente à de `Leve e Pague` pode ser expandida depois sem mudar o contrato base
