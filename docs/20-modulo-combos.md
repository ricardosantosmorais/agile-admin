# 20 - Módulo Combos

## Escopo migrado

`Promoções > Combos` foi migrado para o `admin-v2-web` com:

- listagem server-side;
- formulário principal em abas;
- aba `Produtos`;
- aba `Exceções`;
- bridge completa via `app/api/combos/*`;
- i18n PT/EN;
- testes unitários e E2E do fluxo principal.

## Referência no legado

Base analisada no legado:

- `components/promocoes-list.php`
- `components/promocoes-form.php`
- `controllers/promocoes-controller.php`
- `assets/js/components/promocoes-list.js`
- `assets/js/components/promocoes-form.js`

No legado, o recurso técnico é `promocoes`, mas a navegação e o uso operacional são de `Combos`. O v2 mantém essa distinção:

- rota de frontend: `/combos`
- bridge frontend: `/api/combos`
- recurso real na API: `promocoes`

## Estrutura no v2

### Listagem

A listagem usa:

- `CrudListPage`
- `AppDataTable`
- filtros ocultos por padrão
- exclusão individual e em lote

Colunas migradas:

- `ID`
- `Código`
- `Grupo`
- `Nome`
- `Ativo`

O nome continua abrindo a URL pública quando o combo já possui `slug`.

### Formulário

O formulário usa `TabbedCatalogFormPage` com três abas:

1. `Dados gerais`
2. `Produtos`
3. `Exceções`

#### Dados gerais

Campos migrados:

- `Ativo`
- `Aceita compra parcial`
- `Código`
- `Nome`
- `Tipo`
- `Origem de preço`
- `Grupo`
- `Data início`
- `Data fim`
- `Itens distintos`
- `Imagem`
- `Imagem mobile`
- `Descrição`

Validações migradas do legado:

- `nome` obrigatório
- `tipo` obrigatório
- `origem_preco` obrigatória
- `data_inicio` obrigatória
- `data_fim` obrigatória
- `data_fim >= data_inicio`

#### Aba Produtos

Permite vincular regras por:

- produto pai
- produto
- departamento
- fornecedor
- coleção
- marca

Campos operacionais migrados:

- `altera_quantidade`
- `preco`
- `desconto`
- `pedido_minimo`
- `pedido_maximo`
- `id_embalagem` quando o tipo é `produto`

No v2, edição de item da relação é feita por reconstrução controlada:

- remove o vínculo atual
- recria com os dados ajustados

Isso preserva o comportamento funcional sem reproduzir o acoplamento do legado.

#### Aba Exceções

Permite criar exceções por:

- condição de pagamento
- contribuinte
- cliente
- forma de pagamento
- grupo
- rede
- segmento
- supervisor
- tabela de preço
- tipo de cliente
- UF
- vendedor
- todos

Campos auxiliares migrados:

- `Filial`
- `Praça`
- `Data início`
- `Data fim`

O tipo `classe` não foi migrado porque já aparecia comentado e fora do fluxo operacional ativo no legado.

## Payload e bridges

### Cadastro principal

O formulário principal normaliza:

- booleanos para contrato real da API
- datas para `00:00:00` e `23:59:59`
- `itens_distintos` com fallback `0`

### Produtos

Os vínculos usam:

- `GET /api/combos/[id]/produtos`
- `POST /api/combos/[id]/produtos`
- `DELETE /api/combos/[id]/produtos`

Bridge real na API externa:

- `promocoes/produtos`

### Exceções

Os vínculos usam:

- `GET /api/combos/[id]/excecoes`
- `POST /api/combos/[id]/excecoes`
- `DELETE /api/combos/[id]/excecoes`

Bridge real na API externa:

- `promocoes/excecoes`

## Cobertura de testes

Cobertura mínima criada:

- unitário para mapeadores da feature
- E2E do fluxo principal

Fluxo E2E coberto:

1. abrir listagem de combos
2. criar combo
3. validar persistência do cadastro
4. localizar o item na listagem
5. excluir pela própria tabela

## Pendências conhecidas

- `id_embalagem` ainda está em campo simples no formulário relacional; o legado carregava opções por produto selecionado
- não foi criada base compartilhada nova para essa dependência dinâmica porque o restante da feature já fecha no padrão atual do v2
