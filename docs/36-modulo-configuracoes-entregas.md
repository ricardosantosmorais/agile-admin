# 36 - MÃ³dulo ConfiguraÃ§Ãµes > Entregas

## VisÃ£o geral
`ConfiguraÃ§Ãµes > Entregas` segue o mesmo padrÃ£o inaugurado por `ConfiguraÃ§Ãµes > Clientes`: acesso direto a um formulÃ¡rio de parÃ¢metros do tenant, sem listagem intermediÃ¡ria.

No legado, a tela vive em `configuracoes-entregas-form.php` e tambÃ©m grava diretamente em `empresas/parametros`.

## Fluxo atual no v2
- rota principal: `/configuracoes/entregas`
- bridge: `/api/configuracoes/entregas`
- origem dos parÃ¢metros: `empresas/parametros?id_empresa=<tenant>&order=chave,posicao&perpage=1000`
- origem das opÃ§Ãµes do campo padrÃ£o: `formas_entrega?id_empresa=<tenant>&perpage=1000&order=nome`
- persistÃªncia: `POST empresas/parametros`

## Estrutura do formulÃ¡rio
O formulÃ¡rio estÃ¡ dividido em trÃªs blocos:
- `Frete e rateio`
- `Checkout e seleÃ§Ã£o`
- `Split e encomendas`

## Regras mantidas do legado
- leitura direta dos parÃ¢metros do tenant ativo
- escrita por lote no mesmo endpoint
- inclusÃ£o de `versao` no payload de escrita
- carregamento das formas de entrega para o campo `Forma de entrega padrÃ£o`

## DiferenÃ§as intencionais para o v2
- organizaÃ§Ã£o em seÃ§Ãµes com `SectionCard`
- exibiÃ§Ã£o de metadata de Ãºltima alteraÃ§Ã£o por campo
- payload parcial: o frontend envia apenas os parÃ¢metros alterados
- botÃ£o `Salvar` habilitado somente quando hÃ¡ mudanÃ§a real

## RestriÃ§Ã£o herdada do legado
No legado, a ediÃ§Ã£o desse mÃ³dulo Ã© bloqueada para o tenant `1705083119553379` quando o usuÃ¡rio nÃ£o Ã© `master`. O v2 reflete essa restriÃ§Ã£o visualmente no frontend.

Como a sessÃ£o cookie do v2 ainda nÃ£o carrega esse atributo para enforcement server-side, a regra hoje estÃ¡ aplicada na UI. Se essa restriÃ§Ã£o precisar ser mandatÃ³ria no backend, o ideal Ã© expandir o contexto server-side de autenticaÃ§Ã£o em rodada futura.

## Cobertura
- unitÃ¡rio:
  - `src/features/configuracoes-entregas/services/configuracoes-entregas-mappers.test.ts`
- E2E:
  - `e2e/configuracoes-entregas.spec.ts`

