# 09 - Bridges `app/api`

## Objetivo
As rotas em `app/api/*` são a camada intermediária entre o frontend do Admin v2 e a `api-v3`.

Elas substituem, no v2, boa parte do papel que o backend PHP local exercia no legado.

## Responsabilidades
As bridges fazem, em geral:
- leitura da sessão autenticada;
- extração do token;
- propagação do tenant ativo;
- adaptação de query params e payloads;
- tradução de respostas e erros;
- normalização de `meta` para tabelas;
- exposição de um contrato estável para o frontend.

## Fluxos principais

### Autenticação
Rotas:
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/session/route.ts`
- `app/api/auth/tenant/route.ts`

Função:
- autenticar;
- validar sessão;
- alternar tenant;
- gerenciar cookie assinado.

### CRUDs simples
O padrão genérico está em:
- [crud-route.ts](/C:/Projetos/admin-v2-web/src/services/http/crud-route.ts)

Ele cobre:
- listagem;
- detalhe;
- save;
- delete.

Esse padrão já é usado em vários módulos simples.

### Bridges especializadas
Alguns módulos têm rotas próprias além do CRUD padrão:
- `clients/[id]/linked-users`
- `clients/[id]/linked-sellers`
- `clients/[id]/unlock`
- `usuarios/[id]/clientes`
- `usuarios/[id]/vendedor`
- `usuarios/[id]/acessos`
- `vendedores/[id]/canais`
- `colecoes/[id]/produtos`
- `listas/[id]/produtos`
- `grades/[id]/valores`
- `produtos-departamentos/products`
- `produtos-departamentos/departments`

Esses casos existem quando o módulo tem relação, modal operacional ou fluxo não linear.

## Contrato de sessão
A maioria das bridges segue o mesmo padrão:
1. `readAuthSession()`
2. se não houver sessão, responder `401`
3. chamar `serverApiFetch(...)`
4. enviar `token` e `tenantId`
5. retornar payload normalizado

## Benefícios do desenho atual
- o frontend não precisa conhecer diretamente o contrato cru da `api-v3`;
- o tenant é centralizado;
- autenticação sensível fica fora do client;
- erros ficam padronizados;
- mudanças de backend podem ser absorvidas na bridge sem quebrar as telas.

## Regra de implementação para novos módulos
Antes de criar uma nova tela:
1. verificar se o CRUD padrão resolve o caso;
2. se houver relação ou fluxo operacional, criar rota especializada;
3. manter a adaptação na bridge, não no componente visual;
4. sempre preservar `token + tenantId` como contrato mínimo.

