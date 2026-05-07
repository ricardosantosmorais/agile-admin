# 50 - Módulo Agile Store

## Escopo Migrado

A Agile Store no v2 cobre as superfícies do legado em fatias:

- listagem de módulos em `/agile-store`;
- detalhe do módulo em `/agile-store/[id]`;
- ações de contratar, descontratar e reprocessar;
- filtros por busca, tipo e status;
- cards com preço, benefícios, teste grátis e status de contratação;
- bridges locais para a API v3;
- retaguarda administrativa em `/agile-store/admin`, resolvida pelo componente legado `app-store-admin` quando o menu dinâmico vier do banco/perfil;
- dashboard de visitas, conversões, cancelamentos, performance por módulo, visitas/eventos, contratações e faturamento;
- ações administrativas de marcar faturamento e descontratar contrato por ID.

## Contratos

As bridges do v2 ficam em `app/api/agile-store/*` e encaminham para:

- `GET /app-store/modulos`;
- `GET /app-store/modulos/{id}`;
- `POST /app-store/modulos/{id}/contratar`;
- `POST /app-store/modulos/{id}/descontratar`;
- `POST /app-store/modulos/{id}/reprocessar`;
- `GET /app-store/admin/dashboard`;
- `POST /app-store/admin/contratacoes/{id}/faturamento`;
- `POST /app-store/admin/contratacoes/{id}/descontratar`.

As chamadas preservam o token da sessão e o tenant ativo por aba.

## Permissões

O módulo usa as chaves do legado:

- `APP_STORE`;
- `APP_STORE_VISUALIZAR`;
- `APP_STORE_CONTRATAR`;
- `APP_STORE_DESCONTRATAR`.

No v2, `APP_STORE_CONTRATAR` corresponde à permissão de criação e `APP_STORE_DESCONTRATAR` à permissão de exclusão na avaliação local de acesso.

A retaguarda administrativa continua protegida pela API v3, com a mesma regra do legado para usuários internos Agile e tenant interno. O v2 não cria item fixo de menu; apenas mapeia `app-store-admin` para `/agile-store/admin` quando essa funcionalidade vier do menu dinâmico.

## Fora Desta Fatia

Ainda não foram migrados nesta etapa:

- upload/gestão completa de anexos na resposta do SAC;
- CRUD administrativo do catálogo de módulos/scripts da Agile Store, se ele for formalizado como superfície do v2.

Esses itens permanecem registrados na evidência do batch `agile-store`.
