# 51 - Módulo SAC Admin

## Escopo Migrado

A fatia administrativa do SAC cobre a operação principal de chamados:

- dashboard resumido em `/sac`;
- listagem de chamados com filtros de status, cliente, protocolo, área, assunto e responsável;
- detalhe do chamado com dados principais, histórico de mensagens e anexos vinculados às mensagens;
- resposta ao cliente com anexos, preservando `updated_at` para proteção contra edição concorrente;
- nota interna, alteração de status, atribuição de responsável e transferência entre área/assunto, também preservando `updated_at`;
- restrição de listagem por responsável quando o perfil não possui `SAC_FUNC_LISTAR_TODOS`, conforme o legado;
- configurações do módulo SAC com `ativo`, e-mails permitidos, fechamento automático e prazo de reabertura;
- manutenção de áreas, assuntos e responsáveis do SAC pela superfície administrativa dinâmica, sem inclusão de item fixo no menu;
- bridges locais para os contratos `sac/admin/*` da API v3;
- mapeamento de rota para os componentes legados `sac-dashboard` e `sac-chamados`, sem incluir módulos fixos no menu;
- feature de permissão local `sac` baseada nas chaves e componentes legados `SAC_*`.

## Contratos

As bridges do v2 ficam em `app/api/sac/*` e encaminham para:

- `GET /sac/admin/dashboard`;
- `GET /sac/admin/chamados`;
- `GET /sac/admin/chamados/{id}`;
- `GET /sac/admin/areas`;
- `POST /sac/admin/areas`;
- `DELETE /sac/admin/areas/{id}`;
- `POST /sac/admin/areas/{id}/config`;
- `GET /sac/admin/areas/{id}/responsaveis`;
- `POST /sac/admin/areas/{id}/responsaveis`;
- `DELETE /sac/admin/areas/responsaveis/{id}`;
- `GET /sac/admin/assuntos`;
- `POST /sac/admin/assuntos`;
- `DELETE /sac/admin/assuntos/{id}`;
- `GET /sac/admin/usuarios`;
- `GET /sac/admin/configuracoes`;
- `POST /sac/admin/configuracoes`;
- `POST /sac/admin/chamados/{id}/responder`;
- `POST /sac/admin/chamados/{id}/nota-interna`;
- `POST /sac/admin/chamados/{id}/status`;
- `POST /sac/admin/chamados/{id}/atribuir`;
- `POST /sac/admin/chamados/{id}/transferir`.

As chamadas preservam token de sessão e tenant ativo por aba. A listagem mantém o padrão do legado com ordenação default por `ultima_interacao_em desc`.

No envio de resposta com anexos, a bridge recebe `multipart/form-data`, valida as extensões e o limite de 10MB por arquivo conforme o legado, grava os arquivos no bucket privado por tenant e encaminha para a API v3 o contrato `anexos[]` com `arquivo`, `nome_arquivo_original`, `tipo_mime` e `tamanho`.

## Permissões

A feature `sac` reconhece componentes e chaves do legado como:

- `sac-dashboard`;
- `sac-chamados`;
- `SAC_FUNC`;
- `SAC_DASHBOARD`;
- `SAC_LISTAR`;
- `SAC_VISUALIZAR`;
- `SAC_FUNC_LISTAR_PROPRIOS`;
- `SAC_FUNC_LISTAR_TODOS`;
- `SAC_FUNC_RESPONDER`;
- `SAC_FUNC_NOTA_INTERNA`;
- `SAC_FUNC_ALTERAR_STATUS`;
- `SAC_FUNC_ATRIBUIR_RESPONSAVEL`;
- `SAC_FUNC_TRANSFERIR`.

A UI usa a leitura local de acesso para liberar listagem, visualização, resposta e ações avançadas. As ações continuam protegidas pela API v3.

## Fora Desta Fatia

Ainda não foi migrado nesta etapa:

- retaguarda de gestão da Agile Store.

Esse item permanece registrado na evidência do batch `agile-store` para decisão de produto antes de abrir uma superfície de catálogo/script no v2.
