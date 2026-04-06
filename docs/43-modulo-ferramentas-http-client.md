# 43 - Módulo Ferramentas > HTTP Client

## Escopo atual
Escopo atual migrado para o v2:

- página operacional própria em `/ferramentas/http-client`;
- múltiplas abas de requisição;
- modo de endpoint por catálogo da API ou endpoint custom;
- autenticação por plataforma, bearer, basic ou sem autenticação;
- configuração de query params, headers e body por aba;
- execução server-side com timeout configurável;
- visualização completa da resposta (status, tempo, content-type, headers e body);
- catálogo de requisições salvas com carregar e salvar.

## Decisões
- `HTTP Client` não usa `CrudFormPage` ou `CrudListPage`;
- módulo tratado como tela operacional, no mesmo padrão de `Editor SQL`;
- execução HTTP e persistência de catálogo ficam em bridges `app/api/http-client/*`;
- catálogo reaproveita o backend legado `agilesync_editorsql_consultas`, com `catalog_type=http_client`.

## Base técnica principal
- [http-client-page.tsx](../src/features/http-client/components/http-client-page.tsx)
- [http-client-client.ts](../src/features/http-client/services/http-client-client.ts)
- [route.ts](../app/api/http-client/context/route.ts)
- [route.ts](../app/api/http-client/send/route.ts)
- [route.ts](../app/api/http-client/catalog/route.ts)
- [route.ts](../app/api/http-client/catalog/[id]/route.ts)
- [_shared.ts](../app/api/http-client/_shared.ts)

## Cobertura
Cobertura mínima atual:

- E2E:
  - `e2e/http-client.spec.ts`

## Próximas evoluções no frontend
- atalho de teclado para envio (`Ctrl/Cmd + Enter`);
- exportação de resposta (arquivo);
- persistência local de abas no navegador;
- aba de histórico de execução por tenant/usuário.
