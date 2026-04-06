# 40. MÃ³dulo ConfiguraÃ§Ãµes > Pedidos, PreÃ§os, Produtos e Vendedores

## Objetivo
Migrar os formulÃ¡rios diretos de parÃ¢metros restantes do grupo `ConfiguraÃ§Ãµes`, mantendo o contrato do legado baseado em `empresas/parametros`.

## Escopo desta entrega
- `ConfiguraÃ§Ãµes > Pedidos`
- `ConfiguraÃ§Ãµes > PreÃ§os`
- `ConfiguraÃ§Ãµes > Produtos`
- `ConfiguraÃ§Ãµes > Vendedores`

## PadrÃ£o adotado
- formulÃ¡rio direto, sem listagem intermediÃ¡ria;
- leitura de parÃ¢metros em `empresas/parametros`;
- envio parcial apenas com campos alterados;
- botÃ£o `Salvar` habilitado sÃ³ quando houver mudanÃ§a;
- feedback visual de loading no botÃ£o de salvar;
- cards por seÃ§Ã£o, no mesmo padrÃ£o dos demais itens jÃ¡ migrados de `ConfiguraÃ§Ãµes`.

## Particularidades

### Pedidos
- concentra regras de checkout, pagamento, split e experiÃªncia;
- mantÃ©m os enums operacionais do legado, como atualizaÃ§Ã£o de carrinho e tipo de split.

### PreÃ§os
- alÃ©m dos parÃ¢metros, carrega lookups auxiliares de:
  - formas de pagamento;
  - condiÃ§Ãµes de pagamento;
  - tabelas de preÃ§o.

### Produtos
- normaliza os campos legados que ainda chegam como `1/0` em algumas empresas para valores compatÃ­veis com o formulÃ¡rio atual, especialmente nos controles de visibilidade por perfil.

### Vendedores
- adiciona uma seÃ§Ã£o especÃ­fica de disponibilidade semanal;
- usa janelas de meia em meia hora compatÃ­veis com os parÃ¢metros originais do legado.

## Testes
- cobertura unitÃ¡ria mÃ­nima criada para os mapeadores dos quatro formulÃ¡rios;
- a cobertura E2E especÃ­fica deste bloco ainda depende do bootstrap autenticado estÃ¡vel do ambiente Playwright local, entÃ£o o gap segue registrado como pendÃªncia operacional.

## Performance
- as telas de configuracoes com contrato fixo agora consultam apenas as chaves de `empresas/parametros` usadas pela propria tela.
- `Configuracoes > Precos` e `Configuracoes > Inicio` resolvem no carregamento inicial apenas o valor selecionado (`id + nome`) dos campos de autocomplete.
- as demais opcoes desses campos passam a ser carregadas sob demanda via `/api/lookups/*`.

## Arquivos principais
- `src/features/configuracoes-pedidos/components/configuracoes-pedidos-page.tsx`
- `src/features/configuracoes-precos/components/configuracoes-precos-page.tsx`
- `src/features/configuracoes-produtos/components/configuracoes-produtos-page.tsx`
- `src/features/configuracoes-vendedores/components/configuracoes-vendedores-page.tsx`
- `src/components/form-page/parameter-form-page-base.tsx`
- `src/components/form-page/manual-form-page-shell.tsx`
- `app/api/configuracoes/pedidos/route.ts`
- `app/api/configuracoes/precos/route.ts`
- `app/api/configuracoes/produtos/route.ts`
- `app/api/configuracoes/vendedores/route.ts`

