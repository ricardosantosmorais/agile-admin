# 50 - Módulo Agile Store

## Escopo Migrado

A primeira fatia migrada da Agile Store cobre a superfície pública do legado:

- listagem de módulos em `/agile-store`;
- detalhe do módulo em `/agile-store/[id]`;
- ações de contratar, descontratar e reprocessar;
- filtros por busca, tipo e status;
- cards com preço, benefícios, teste grátis e status de contratação;
- bridges locais para a API v3.

## Contratos

As bridges do v2 ficam em `app/api/agile-store/*` e encaminham para:

- `GET /app-store/modulos`;
- `GET /app-store/modulos/{id}`;
- `POST /app-store/modulos/{id}/contratar`;
- `POST /app-store/modulos/{id}/descontratar`;
- `POST /app-store/modulos/{id}/reprocessar`.

As chamadas preservam o token da sessão e o tenant ativo por aba.

## Permissões

O módulo usa as chaves do legado:

- `APP_STORE`;
- `APP_STORE_VISUALIZAR`;
- `APP_STORE_CONTRATAR`;
- `APP_STORE_DESCONTRATAR`.

No v2, `APP_STORE_CONTRATAR` corresponde à permissão de criação e `APP_STORE_DESCONTRATAR` à permissão de exclusão na avaliação local de acesso.

## Fora Desta Fatia

Ainda não foram migrados nesta etapa:

- SAC administrativo;
- chamados, dashboard, áreas, assuntos e configurações do SAC;
- retaguarda de gestão da Agile Store;
- métricas, visitas, faturamento e cancelamento administrativo.

Esses itens permanecem registrados na evidência do batch `agile-store`.
