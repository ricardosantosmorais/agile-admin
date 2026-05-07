# 35 - MÃ³dulo ConfiguraÃ§Ãµes > Clientes

## VisÃ£o geral
`ConfiguraÃ§Ãµes > Clientes` Ã© o primeiro item migrado do grupo `ConfiguraÃ§Ãµes`. Diferente da maioria dos mÃ³dulos CRUD do v2, ele nÃ£o possui listagem: o acesso vai direto para um formulÃ¡rio de parÃ¢metros do tenant.

Esse comportamento segue o legado em `configuracoes-clientes-form.php`, que jÃ¡ carregava e salvava parÃ¢metros diretamente em `empresas/parametros`.

## Fluxo atual no v2
- rota principal: `/configuracoes/clientes`
- bridge: `/api/configuracoes/clientes`
- origem dos dados: `empresas/parametros?id_empresa=<tenant>&order=chave,posicao&perpage=1000`
- persistÃªncia: `POST empresas/parametros`

O formulÃ¡rio estÃ¡ organizado em trÃªs blocos:
- `Cadastro e ativaÃ§Ã£o`
- `ExperiÃªncia apÃ³s login`
- `CrÃ©dito e validaÃ§Ãµes`

## DecisÃ£o de UX
Para `ConfiguraÃ§Ãµes > Clientes`, o v2 usa pÃ¡gina de formulÃ¡rio direto, com breadcrumb e aÃ§Ãµes de salvar no topo e no rodapÃ©.

Essa abordagem servirÃ¡ de base para outros itens de `ConfiguraÃ§Ãµes` que, no legado, tambÃ©m nÃ£o possuem tela de listagem intermediÃ¡ria.

## Regras mantidas do legado
- leitura de todos os parÃ¢metros do tenant ativo via `empresas/parametros`
- escrita por lote no mesmo endpoint
- inclusÃ£o de `versao` no payload de escrita
- campos sem validaÃ§Ã£o de negÃ³cio adicional no frontend
- `seleciona_filial` usa os perfis `cliente`, `vendedor`, `todos` e `nao`; valores booleanos antigos continuam sendo normalizados como `todos`/`nao`

## DiferenÃ§as intencionais para o v2
- layout agrupado por seÃ§Ãµes, em vez da sequÃªncia contÃ­nua do legado
- metadata de Ãºltima alteraÃ§Ã£o exibida por campo quando a API devolve `created_at` e `usuario.nome`
- i18n completo em PT-BR e EN

## Cobertura
- unitÃ¡rio:
  - `src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts`
- E2E:
  - `e2e/configuracoes-clientes.spec.ts`

## PrÃ³ximos passos naturais
- migrar os demais itens de `ConfiguraÃ§Ãµes` reaproveitando o padrÃ£o de formulÃ¡rio direto quando o legado nÃ£o tiver listagem
- avaliar se vale criar uma base compartilhada para parÃ¢metros simples de tenant, caso outros mÃ³dulos repitam o mesmo contrato com `empresas/parametros`

