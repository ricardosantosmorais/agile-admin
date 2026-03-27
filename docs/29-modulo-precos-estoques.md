# 29 - Módulo Preços e Estoques

## Escopo desta rodada

- `Tributos`
- `Tributos x Partilha`
- `Produtos x Filiais`
- `Produtos x Tabelas de Preço`
- `Produtos x Precificadores`

## Decisões desta migração

- `Tributos`, `Tributos x Partilha` e `Produtos x Filiais` seguem o padrão de CRUD linear do v2 com `CrudListPage` e `CrudFormPage`.
- `Produtos x Filiais` usa chave composta no backend (`id_produto`, `id_filial`, `id_tabela_preco`, `id_canal_distribuicao_cliente`). O v2 trata isso na bridge `app/api/produtos-x-filiais/*` e expõe um `id` sintético apenas para a UI.
- `Produtos x Tabelas de Preço` não usa `CrudFormPage`. A listagem expõe `Precificação rápida` em vez de `Novo`, e a edição por linha leva para a tela operacional por produto, como no legado.
- `Produtos x Precificadores` também não usa `CrudFormPage`. O módulo foi redesenhado como um wizard moderno com etapas curtas, revisão final e gravação em lote pela bridge, sem expor `id_pai` na interface.
- Erros operacionais inesperados vindos da `api-v3`, como `SQLSTATE`, contrato quebrado ou falha `5xx`, passam a ser enviados ao Sentry de forma centralizada via `serverApiFetch`. Validações usuais de formulário não entram nessa captura.

## Contratos relevantes

### Produtos x Filiais

- recurso real: `produtos/filiais`
- embeds usados no v2:
  - `produto`
  - `filial`
  - `tabela_preco`
  - `canal_distribuicao`
- a exclusão continua sendo enviada com a chave composta real

### Produtos x Tabelas de Preço

- listagem real: `produtos_tabelas_preco`
- precificação rápida:
  - busca todas as `tabelas_preco`
  - busca os registros atuais de `produtos_tabelas_preco` para o produto
  - monta a grade cruzada no frontend
  - salva em lote via bridge `app/api/produtos-x-tabelas-de-preco/rapida`

### Produtos x Precificadores

- recurso real: `produtos_precificadores`
- a listagem padrão considera apenas registros raiz (`id_pai` nulo), com opção de incluir dependentes para inspeção
- o wizard carrega pai e filhos na edição, reconstrói o rascunho operacional e salva em lote via `app/api/produtos-x-precificadores/wizard`
- o frontend trabalha com:
  - critérios de público-alvo
  - critérios de produtos
  - blocos de definição
  - condições e validade
- a bridge converte o rascunho em linhas cruzadas e resolve:
  - criação de pai e filhos
  - atualização por identidade da linha
  - exclusão de dependentes removidos

## Wizard de Produtos x Precificadores

### Etapas

1. `Público-alvo`
2. `Produtos`
3. `Regra`
4. `Condições`
5. `Revisão`

### Direção de UX

- o legado foi usado como fonte de regra de negócio, não como referência visual literal
- a experiência do v2 prioriza:
  - progresso claro
  - menos densidade por etapa
  - resumo antes de salvar
  - feedback explícito de loading e erro
- a mecânica de `id_pai` fica encapsulada na bridge e não aparece para o usuário

### Regras de flatten

- cada critério de público pode gerar um ou mais destinos
- cada critério de produto pode gerar um ou mais produtos ou combinações com embalagem
- cada definição gera uma linha operacional
- o save final cruza público, produto e definição para montar o lote persistido

## Cobertura prevista

- testes unitários para:
  - normalização e serialização de `Tributos`
  - normalização e serialização de `Tributos x Partilha`
  - chave composta e serialização de `Produtos x Filiais`
  - mapeadores de `Produtos x Tabelas de Preço`
  - transformação do wizard de `Produtos x Precificadores`
- E2E dedicados por módulo:
  - `tributos.spec.ts`
  - `tributos-partilha.spec.ts`
  - `produtos-filiais.spec.ts`
  - `produtos-tabelas-preco.spec.ts`
  - `produtos-precificadores.spec.ts`

## Observações atuais

- `Produtos x Precificadores` já tem teste unitário de transformação do wizard
- o spec E2E do módulo foi criado, mas a validação local ficou bloqueada pela `auth.setup.ts` do ambiente, que não avançou além de `/login`
