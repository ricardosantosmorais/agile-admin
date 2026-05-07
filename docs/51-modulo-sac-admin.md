# 51 - Módulo SAC Admin

## Escopo Migrado

A primeira fatia administrativa do SAC cobre a operação principal de chamados:

- dashboard resumido em `/sac`;
- listagem de chamados com filtros de status, cliente e protocolo;
- detalhe do chamado com dados principais, histórico de mensagens e anexos vinculados às mensagens;
- ação de resposta ao cliente, preservando `updated_at` para proteção contra edição concorrente;
- bridges locais para os contratos `sac/admin/*` da API v3;
- mapeamento de menu dos componentes legados `sac-dashboard` e `sac-chamados`;
- feature de permissão local `sac` baseada nas chaves e componentes legados `SAC_*`.

## Contratos

As bridges do v2 ficam em `app/api/sac/*` e encaminham para:

- `GET /sac/admin/dashboard`;
- `GET /sac/admin/chamados`;
- `GET /sac/admin/chamados/{id}`;
- `POST /sac/admin/chamados/{id}/responder`;
- `POST /sac/admin/chamados/{id}/nota-interna`;
- `POST /sac/admin/chamados/{id}/status`;
- `POST /sac/admin/chamados/{id}/atribuir`;
- `POST /sac/admin/chamados/{id}/transferir`.

As chamadas preservam token de sessão e tenant ativo por aba. A listagem mantém o padrão do legado com ordenação default por `ultima_interacao_em desc`.

## Permissões

A feature `sac` reconhece componentes e chaves do legado como:

- `sac-dashboard`;
- `sac-chamados`;
- `SAC_FUNC`;
- `SAC_DASHBOARD`;
- `SAC_LISTAR`;
- `SAC_VISUALIZAR`.

Na primeira fatia, a UI usa a leitura local de acesso para liberar listagem, visualização e resposta. As ações continuam protegidas pela API v3.

## Fora Desta Fatia

Ainda não foram migrados nesta etapa:

- cadastros de áreas;
- cadastros de assuntos;
- configurações do módulo SAC;
- upload/gestão completa de anexos na resposta;
- transferência, atribuição, nota interna e alteração de status com formulários completos;
- retaguarda de gestão da Agile Store.

Esses itens permanecem registrados na evidência do batch `agile-store` para as próximas fatias.
