# 39 - MÃ³dulo ConfiguraÃ§Ãµes > Layout

## VisÃ£o geral
`ConfiguraÃ§Ãµes > Layout` segue o padrÃ£o de formulÃ¡rio direto do menu `ConfiguraÃ§Ãµes`, mantendo compatibilidade com o legado sem introduzir um page builder paralelo.

No legado, a tela vive em:
- `components/configuracoes-layout-form.php`
- `controllers/configuracoes-layout-controller.php`
- `assets/js/components/configuracoes-layout-form.js`

Ela combina:
- uploads de branding;
- CSS global;
- fragmentos HTML por regiÃ£o;
- SEO.

## Fluxo atual no v2
- rota principal: `/configuracoes/layout`
- bridge: `/api/configuracoes/layout`
- origem dos parÃ¢metros: `empresas/parametros?id_empresa=<tenant>&order=chave,posicao&perpage=1000`
- contexto da empresa: `empresas?id=<tenant>&perpage=1`

## Estrutura da tela
O v2 organiza a ediÃ§Ã£o em abas horizontais, no mesmo espÃ­rito das telas jÃ¡ consolidadas do produto:
- `Branding`
- `Tema`
- `Topo`
- `Menu`
- `Newsletter`
- `ServiÃ§os`
- `RodapÃ©`
- `SEO`

Cada aba segue um padrÃ£o simples:
- `Branding`: uploads compartilhados de logo e Ã­cone;
- `Tema`: editor de CSS;
- `Topo` e `Menu`: editor com alternÃ¢ncia `Desktop | Mobile`;
- `Newsletter`, `ServiÃ§os` e `RodapÃ©`: editor HTML;
- `SEO`: formulÃ¡rio convencional.

## Contrato preservado do legado
O save continua compatÃ­vel com a lÃ³gica antiga:
- grava parÃ¢metros em `empresas/parametros`;
- inclui `versao` a cada alteraÃ§Ã£o;
- faz upload derivado para:
  - `css_file`
  - `barra-topo_file`
  - `barra-topo-mobile_file`
  - `barra-menu_file`
  - `barra-menu-mobile_file`
  - `barra-newsletter_file`
  - `barra-servicos_file`
  - `barra-rodape_file`
- marca como `arquivo = true` os parÃ¢metros fonte de CSS/HTML, igual ao legado;
- atualiza `empresas` para refletir:
  - `logo`
  - `logo_alt` quando o legado exigia espelhamento
  - `ico`

## DiferenÃ§as intencionais para o v2
- a tela deixa de ser uma sequÃªncia de abas do legado com ACE;
- branding usa o componente compartilhado de upload;
- os editores usam Monaco;
- `Salvar` sÃ³ habilita quando existe alteraÃ§Ã£o real;
- cada aba de cÃ³digo tem aÃ§Ã£o de `Restaurar` para voltar ao conteÃºdo original carregado;
- a experiÃªncia foi simplificada para manter estabilidade e previsibilidade.

## ObservaÃ§Ãµes de UX
- `Topo` e `Menu` preservam ediÃ§Ã£o separada de `Desktop` e `Mobile`;
- o seletor de viewport deixa explÃ­cito qual variante estÃ¡ sendo alterada;
- a tela nÃ£o tenta mais renderizar preview parcial da loja;
- a validaÃ§Ã£o visual do resultado continua sendo feita no storefront real apÃ³s salvar, atÃ© que exista uma estratÃ©gia confiÃ¡vel de preview.

## Cobertura
- unitÃ¡rio:
  - `src/features/configuracoes-layout/services/configuracoes-layout-mappers.test.ts`
- E2E:
  - `e2e/configuracoes-layout.spec.ts`
  - observaÃ§Ã£o: no ambiente local atual, a execuÃ§Ã£o autenticada do Playwright ainda depende do bootstrap de login do runner.

