# 37 - MÃ³dulo ConfiguraÃ§Ãµes > Geral

## VisÃ£o geral
`ConfiguraÃ§Ãµes > Geral` Ã© o terceiro item migrado do menu `ConfiguraÃ§Ãµes`, mantendo o padrÃ£o de formulÃ¡rio direto, sem listagem intermediÃ¡ria.

Diferente de `Clientes` e `Entregas`, esta tela Ã© guiada por schema: o legado busca a definiÃ§Ã£o dos campos em `configuracoes_empresa` e renderiza o formulÃ¡rio dinamicamente.

## Fluxo atual no v2
- rota principal: `/configuracoes/geral`
- bridge: `/api/configuracoes/geral`
- origem dos parÃ¢metros: `empresas/parametros?id_empresa=<tenant>&order=posicao&perpage=10000`
- origem do schema: `configuracoes_empresa?perpage=999&id_parametro_grupo=3&field=ordem&editavel=true...`
- leitura complementar da empresa: `empresas?id=<tenant>`
- persistÃªncia de parÃ¢metros: `POST empresas/parametros`
- persistÃªncia de dados da empresa: `POST empresas`

## Regras mantidas do legado
- acesso restrito a usuÃ¡rio `master`
- inclusÃ£o de `versao` no payload de parÃ¢metros
- renderizaÃ§Ã£o respeitando ordem, label, descriÃ§Ã£o e tipo definidos no schema editÃ¡vel
- sincronizaÃ§Ã£o dos campos especiais com o cadastro da empresa:
  - `modo_ecommerce`
  - `url_site`
  - `url_imagens`

## DiferenÃ§as intencionais para o v2
- organizaÃ§Ã£o em cards e feedback visual do padrÃ£o atual
- payload parcial: somente campos alterados sÃ£o enviados
- botÃ£o `Salvar` habilitado apenas quando hÃ¡ mudanÃ§a real
- loading no botÃ£o de salvar

## ObservaÃ§Ãµes tÃ©cnicas
- os campos especiais continuam sendo gravados tambÃ©m em `empresas/parametros`, como no legado, mas agora o v2 tambÃ©m envia o patch estruturado para `empresas`
- a validaÃ§Ã£o de `master` segue aplicada na UI, pois o cookie server-side atual nÃ£o carrega esse atributo de forma direta

## Cobertura
- unitÃ¡rio:
  - `src/features/configuracoes-geral/services/configuracoes-geral-mappers.test.ts`
- E2E:
  - `e2e/configuracoes-geral.spec.ts`

