# 40. Módulo Configurações > Pedidos, Preços, Produtos e Vendedores

## Objetivo
Migrar os formulários diretos de parâmetros restantes do grupo `Configurações`, mantendo o contrato do legado baseado em `empresas/parametros`.

## Escopo desta entrega
- `Configurações > Pedidos`
- `Configurações > Preços`
- `Configurações > Produtos`
- `Configurações > Vendedores`

## Padrão adotado
- formulário direto, sem listagem intermediária;
- leitura de parâmetros em `empresas/parametros`;
- envio parcial apenas com campos alterados;
- botão `Salvar` habilitado só quando houver mudança;
- feedback visual de loading no botão de salvar;
- cards por seção, no mesmo padrão dos demais itens já migrados de `Configurações`.

## Particularidades

### Pedidos
- concentra regras de checkout, pagamento, split e experiência;
- mantém os enums operacionais do legado, como atualização de carrinho e tipo de split;
- preserva a chave legada `exibe_juros_parcelas`, usada para exibir informação de juros das condições nas parcelas do cartão no checkout.

### Preços
- além dos parâmetros, carrega lookups auxiliares de:
  - formas de pagamento;
  - condições de pagamento;
  - tabelas de preço.

### Produtos
- normaliza os campos legados que ainda chegam como `1/0` em algumas empresas para valores compatíveis com o formulário atual, especialmente nos controles de visibilidade por perfil.

### Vendedores
- adiciona uma seção específica de disponibilidade semanal;
- usa janelas de meia em meia hora compatíveis com os parâmetros originais do legado.

## Testes
- cobertura unitária mínima criada para os mapeadores dos quatro formulários;
- a cobertura E2E específica deste bloco ainda depende do bootstrap autenticado estável do ambiente Playwright local, então o gap segue registrado como pendência operacional.

## Performance
- as telas de configurações com contrato fixo agora consultam apenas as chaves de `empresas/parametros` usadas pela própria tela.
- `Configurações > Preços` e `Configurações > Início` resolvem no carregamento inicial apenas o valor selecionado (`id + nome`) dos campos de autocomplete.
- as demais opções desses campos passam a ser carregadas sob demanda via `/api/lookups/*`.

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
