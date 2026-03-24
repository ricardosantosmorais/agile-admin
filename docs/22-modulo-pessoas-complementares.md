# 22 - Módulos Complementares de Pessoas

## Escopo
Este documento cobre os módulos do menu `Pessoas` que fecham a trilha operacional fora de `Clientes`, `Usuários`, `Vendedores`, `Supervisores` e `Grupos de Clientes`:

- `Contatos`
- `Redes de Clientes`
- `Segmentos de Clientes`
- `Regras de Cadastro`

## Padrões adotados

### `Redes de Clientes`
- segue o padrão de CRUD simples com `CrudListPage` + `CrudFormPage`;
- mantém os mesmos campos do legado: `ativo`, `código` e `nome`;
- usa bridge dedicada em `app/api/redes/*`.

### `Segmentos de Clientes`
- segue o padrão de CRUD simples;
- mantém os campos `pedido_minimo` e `peso_minimo` com normalização para o contrato da `api-v3`;
- usa bridge dedicada em `app/api/segmentos/*`.

### `Regras de Cadastro`
- usa `CrudFormPage` com múltiplas seções lineares;
- preserva o shape do legado para filtros cadastrais, regras booleanas e relacionamentos com filial, praça, tabela de preço, vendedor e canal;
- concentra normalização e payload em `regras-cadastro-form.ts`;
- usa bridge dedicada em `app/api/regras-cadastro/*`.

### `Contatos`
- permanece como tela operacional própria;
- a listagem mantém filtros por documento, cliente, contato, e-mail, telefones, período e status;
- o fluxo principal continua sendo consulta detalhada e mudança de status (`aprovar`/`reprovar`);
- o detalhe é carregado por modal, com bridge própria em `app/api/contatos/*`.

## Contratos e legado
- o legado foi comparado contra `controllers/contatos-controller.php`, `controllers/redes-controller.php`, `controllers/segmentos-controller.php` e `controllers/regras-cadastro-controller.php`;
- os formulários legados usados como referência foram `components/contatos-list.php`, `components/redes-form.php`, `components/segmentos-form.php` e `components/regras-cadastro-form.php`;
- a `api-v3` expõe os recursos `contatos`, `redes`, `segmentos` e `regras_cadastro`, consumidos no v2 via `app/api/*`.
