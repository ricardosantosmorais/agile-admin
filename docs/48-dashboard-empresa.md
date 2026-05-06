# 48 - Dashboard da Empresa

## Objetivo

O dashboard da empresa é a visão executiva do tenant selecionado. Ele mostra receita realizada, pedidos realizados, comportamento de clientes, mix de canais, produtos, pagamentos e incentivos comerciais.

Na interface, as legendas e tooltips devem explicar a regra em linguagem de usuário: "como chegamos neste número" sem citar tabela ou SQL. Esta documentação, por outro lado, registra a origem técnica para o time da Agile.

## Experiência do Usuário

Os cards principais agora seguem a mesma semântica usada no dashboard root:

- **Receita realizada**: soma dos pedidos cuja data do pedido está no período e cujo status atual é aceito pela regra comercial.
- **Pedidos realizados**: quantidade de pedidos pela mesma regra da receita realizada.
- **Ticket médio realizado**: receita realizada dividida por pedidos realizados.
- **Taxa de conversão**: aproveitamento entre intenção de compra e pedidos válidos no período.

Os tooltips do dashboard da empresa devem deixar claro que:

- a data usada é a data do pedido;
- a classificação usa o status atual do pedido;
- carrinho, consulta, rejeição, cancelamento, estorno, devolução total e rascunho não entram na receita realizada;
- gráficos de funil/status não devem ser interpretados como linha do tempo de transição de status.

## Arquitetura Frontend

Fluxo de dados:

```text
src/features/dashboard/components/dashboard-page.tsx
  -> src/features/dashboard/hooks/use-dashboard-sequenced-snapshot.ts
  -> src/services/app-data.ts
  -> app/api/dashboard/route.ts
  -> api-v3: POST relatorios/dashboard-v2-comparativo
```

O frontend divide a carga em fases para reduzir tempo percebido:

| Fase | Blocos enviados para a API | Uso na tela |
| --- | --- | --- |
| `summary` | `resumo` | KPIs principais |
| `customers` | `clientes_resumo` | Indicadores de clientes |
| `series` | `serie`, `alertas`, `resumo`, `funil`, `operacao` | Receita diária e alertas |
| `funnel` | `funil` | Funil de conversão e taxa |
| `mix` | `mix` | Canais e emitente |
| `clients` | `clientes_listas`, `coorte` | Top clientes e recompra |
| `operations` | `produtos`, `operacao` | Top produtos e receita por hora |
| `payments` | `pagamentos`, `marketing_resumo` | Formas de pagamento e resumo de incentivos |
| `marketingMix` | `marketing_mix` | Mix e receita por incentivo |
| `marketingTops` | `marketing_tops` | Top cupons e promoções |

O hook `useDashboardSequencedSnapshot` controla a pressão de requisições do dashboard:

- se duas chamadas idênticas entram no mesmo ciclo de carga, a segunda reaproveita a requisição em andamento;
- quando tenant, período, comparação ou atualização iniciam um novo ciclo, as requisições antigas recebem `AbortSignal` e respostas obsoletas são ignoradas;
- as seções pesadas continuam sendo solicitadas por viewport, e a carga completa fica reservada para a exportação de PDF.

## Regra Comercial

A API do dashboard da empresa usa a lista de status válidos do `RelatorioController::validStatuses()`.

Entram na leitura comercial realizada:

- `recebido`
- `em_analise`
- `pagamento_em_analise`
- `aguardando_pagamento`
- `pagamento_aprovado`
- `aprovado`
- `aguardando_faturamento`
- `faturado`
- `faturado_parcial`
- `em_conferencia`
- `conferido`
- `aguardando_separacao`
- `em_separacao`
- `separado`
- `coletado`
- `em_transporte`
- `entregue`
- `concluido`
- `pendente`
- `devolvido_parcial`
- `reentrega`
- `aguardando_recepcao`
- `bloqueio_financeiro`
- `bloqueio_comercial`
- `bloqueio_sefaz`
- `nota_denegada`
- `pronto_retirada`

Ficam fora da leitura comercial realizada:

- `carrinho`
- `consulta`
- `rejeitado`
- `pagamento_reprovado`
- `reprovado`
- `cancelado`
- `estornado`
- `devolvido`
- `rascunho`

Status de cancelamento usados em indicadores de cancelamento:

- `rejeitado`
- `pagamento_reprovado`
- `reprovado`
- `cancelado`
- `estornado`
- `devolvido`

## Fontes de Dados

| Bloco | Fonte técnica principal | Regra principal |
| --- | --- | --- |
| Receita, pedidos e ticket | `pedidos` | `deleted_at IS NULL`, `data BETWEEN início AND fim`, `status IN validStatuses()` |
| Série diária | `pedidos` | Agrupa receita, pedidos e ticket por data do pedido |
| Funil | `pedidos` | Compara carrinho, aprovados, faturados e cancelados conforme status |
| Canais e emitente | `pedidos` | Agrupa pedidos válidos por canal/origem e tipo de emitente |
| Clientes | `pedidos` e `clientes` | Considera clientes com compras válidas no período e histórico de recompra |
| Produtos | `pedidos_produtos`, `pedidos`, `produtos` | Itens vinculados a pedidos válidos |
| Pagamentos | `pedidos_pagamentos` e `pedidos` | Formas de pagamento dos pedidos válidos |
| Marketing | `pedidos`, `pedidos_produtos`, cupons, promoções e precificadores quando disponíveis | Classifica incentivo comercial em pedidos/itens válidos |
| Operação | `pedidos` | Distribuição de receita válida por hora do pedido |

## Contrato de UI

O arquivo `src/features/dashboard/services/dashboard-mappers.ts` transforma o payload da API em `DashboardSnapshot`. As descrições técnicas não devem vazar para a interface. A UI deve usar:

- legendas curtas no card;
- tooltip com regra de negócio em linguagem comum;
- tabela/gráfico com tooltip de seção quando a métrica puder ser ambígua;
- traduções em `src/i18n/dictionaries/pt-BR.ts` e `src/i18n/dictionaries/en-US.ts`.

## Relação Com o Dashboard Root

O dashboard root Agile consolida empresas a partir de tabelas analíticas, principalmente `analitico_pedidos_status_diario`. Para evitar divergências entre o total visto pela empresa e o consolidado root, a regra comercial de status deve permanecer alinhada entre:

- `RelatorioController::validStatuses()` no dashboard da empresa;
- `DashboardAgileecommerceController::analyticsValidStatuses()` no dashboard root;
- textos e tooltips em `dashboard-page.tsx` e `dashboard-root-agileecommerce-page.tsx`;
- documentação `46`, `47` e este documento.

Se a lista de status válidos mudar na API, a documentação e os tooltips precisam ser revisados na mesma entrega.
