# 32 - Módulo Pedidos

## Escopo atual
Escopo atual migrado para o v2:

- listagem server-side de pedidos;
- filtros principais do legado;
- detalhe operacional em página própria;
- blocos de informações, valores, pagamento, cliente, entrega, cobrança, produtos, timeline, detalhes e logs;
- atualização de observações internas;
- atualização operacional de entrega com status, rastreamento, código e prazo;
- visualização de logs e payloads JSON no detalhe;
- ações operacionais de aprovar pagamento e cancelar pedido com motivo.

## Decisões
- `Pedidos` não foi encaixado em `CrudFormPage`;
- o módulo usa página própria de listagem e página própria de detalhe, por ser operacional e denso;
- as bridges passam por `app/api/pedidos/*`;
- as ações operacionais seguem a mesma sequência do legado:
  - carregar o pedido;
  - registrar `pedidos/status`;
  - registrar `pedidos/log`;
  - atualizar `pedidos`.

## Cobertura atual
- unitário:
  - `src/features/pedidos/services/pedidos-mappers.test.ts`
- E2E:
  - `e2e/pedidos.spec.ts`

## Próxima rodada
- refinamentos visuais e operacionais adicionais conforme o QA funcional;
- expansão de cenários E2E para mais ações do detalhe.
