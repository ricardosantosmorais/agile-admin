# 38 - MÃ³dulo ConfiguraÃ§Ãµes > InÃ­cio

## VisÃ£o geral
`ConfiguraÃ§Ãµes > InÃ­cio` segue o padrÃ£o dos demais itens diretos de `ConfiguraÃ§Ãµes`: a rota abre diretamente um formulÃ¡rio de parÃ¢metros do tenant, sem listagem intermediÃ¡ria.

No legado, a tela vive em `configuracoes-inicio-form.php` e grava diretamente em `empresas/parametros`.

## Fluxo atual no v2
- rota principal: `/configuracoes/inicio`
- bridge: `/api/configuracoes/inicio`
- origem dos parÃ¢metros: `empresas/parametros?id_empresa=<tenant>&order=chave,posicao&perpage=1000`
- lookups auxiliares:
  - `filiais`
  - `formas_pagamento`
  - `condicoes_pagamento`
  - `tabelas_preco`
- persistÃªncia: `POST empresas/parametros`

## Estrutura do formulÃ¡rio
O formulÃ¡rio estÃ¡ dividido em trÃªs blocos:
- `NavegaÃ§Ã£o padrÃ£o`
- `PrecificaÃ§Ã£o inicial`
- `Pagamento padrÃ£o`

## Regras mantidas do legado
- leitura direta dos parÃ¢metros do tenant ativo
- escrita por lote no mesmo endpoint
- inclusÃ£o de `versao` no payload de escrita
- carregamento de filial, forma de pagamento, condiÃ§Ã£o e tabela de preÃ§o para composiÃ§Ã£o do contexto inicial

## DiferenÃ§as intencionais para o v2
- organizaÃ§Ã£o em seÃ§Ãµes com `SectionCard`
- lookups com autocomplete local para listas mais extensas
- exibiÃ§Ã£o de metadata de Ãºltima alteraÃ§Ã£o por campo
- payload parcial: o frontend envia apenas os parÃ¢metros alterados
- botÃ£o `Salvar` habilitado somente quando hÃ¡ mudanÃ§a real

## RestriÃ§Ã£o herdada do legado
No legado, a ediÃ§Ã£o desse mÃ³dulo Ã© bloqueada para o tenant `1705083119553379` quando o usuÃ¡rio nÃ£o Ã© `master`. O v2 reflete essa mesma restriÃ§Ã£o visualmente no frontend.

## Cobertura
- unitÃ¡rio:
  - `src/features/configuracoes-inicio/services/configuracoes-inicio-mappers.test.ts`
- E2E:
  - `e2e/configuracoes-inicio.spec.ts`

