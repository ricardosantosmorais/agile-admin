# Módulo Produtos

## Escopo atual no v2

O módulo `Produtos` entrou no v2 com a base principal do recurso:

- listagem server-side com filtros centrais do legado;
- formulário principal com abas:
  - `Dados gerais`
  - `Classificação`
  - `Conteúdo`
  - `Estoque e logística`
  - `Filiais`
  - `Embalagens`
  - `SEO`
  - `Promoção`
  - `Grades e cores`
  - `Relacionados`
  - `Imagens`

## Recurso principal

- recurso base: `produtos`
- bridges:
  - `GET /api/produtos`
  - `POST /api/produtos`
  - `DELETE /api/produtos`
  - `GET /api/produtos/[id]`
  - `GET /api/produtos/[id]/filiais`
  - `POST /api/produtos/[id]/filiais`
  - `DELETE /api/produtos/[id]/filiais`
  - `GET /api/produtos/[id]/embalagens`
  - `POST /api/produtos/[id]/embalagens`
  - `DELETE /api/produtos/[id]/embalagens`
  - `GET /api/produtos/[id]/relacionados`
  - `POST /api/produtos/[id]/relacionados`
  - `DELETE /api/produtos/[id]/relacionados`
  - `GET /api/produtos/[id]/imagens`
  - `POST /api/produtos/[id]/imagens`
  - `DELETE /api/produtos/[id]/imagens`

## Aderências já cobertas

- novo registro salva e segue para edição;
- edição salva e retorna para a listagem;
- listagem com filtros:
  - `ID`
  - `Código`
  - `SKU`
  - `EAN`
  - `Canal de distribuição`
  - `Filial`
  - `Fornecedor`
  - `Marca`
  - `Nome`
  - `Status`
  - `Disponível`
  - `Ativo`
- abas relacionais de edição:
  - `Filiais`
  - `Embalagens`
  - `Relacionados`
  - `Imagens`
- persistência da seleção dinâmica de `Grades e cores` via `ids_grades_json`, com sincronização para `produtos/grades_valores` na bridge.

## Cobertura atual

- unitário:
  - `src/features/produtos/services/produtos-mappers.test.ts`
- E2E:
  - `e2e/produtos.spec.ts`

## Pendências conhecidas

Ainda restam refinamentos do legado dentro do módulo:

- experiência operacional mais profunda de `Grades`, caso seja necessário suportar regras avançadas adicionais;
- validações mais densas e fluxos complementares específicos do legado, se aparecerem no QA funcional.

## Observação arquitetural

`Produtos` não deve ser tratado como `CrudFormPage` linear. O módulo exige uma página tabulada própria, com bridge principal do recurso e tabs relacionais plugadas por contexto do produto em edição.
