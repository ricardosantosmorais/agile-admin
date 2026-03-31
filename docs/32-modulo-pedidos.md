# Módulo de Pedidos

## Escopo atual

Escopo atual migrado para o v2:

- listagem server-side de pedidos;
- filtros principais do legado;
- detalhe operacional em página própria;
- blocos de informações, valores, pagamento, cliente, entrega, cobrança, produtos, timeline, detalhes e logs;
- detalhe organizado em grupos navegáveis na própria página, para reduzir altura sem fragmentar o fluxo operacional;
- atualização de observações internas;
- atualização operacional de entrega com status, rastreamento, código e prazo;
- visualização de logs e payloads JSON no detalhe;
- ações operacionais de aprovar pagamento e cancelar pedido com motivo.

## Decisões

- `Pedidos` não foi encaixado em `CrudFormPage`.
- A tela usa página própria de listagem e página própria de detalhe, por ser um módulo operacional denso.
- As bridges passam por `app/api/pedidos/*`.
- As ações operacionais seguem a mesma sequência do legado:
  - carregar o pedido;
  - registrar `pedidos/status`;
  - registrar `pedidos/log`;
  - atualizar `pedidos`.
- O detalhe consolida dados de pedido, cliente, pagamento, entrega e logs na mesma página, evitando navegação fragmentada.

## Próxima rodada

- refinamento visual fino do detalhe para aproximar ainda mais do legado;
- ações operacionais adicionais conforme o legado;
- expansão da cobertura E2E para os cenários operacionais do detalhe.
