# 03 - Autenticação, Sessão e Multiempresa

## Visão geral
No legado, sessão e autorização estavam espalhadas principalmente entre `boot.php`, `includes/acesso.php` e helpers de backend.

No v2, o fluxo foi reorganizado em camadas explícitas:
- `AuthProvider`
- `TenantProvider`
- `SessionLifecycleProvider`
- `httpClient`
- bridges `app/api/*`

Arquivos principais:
- [auth-context.tsx](/C:/Projetos/admin-v2-web/src/contexts/auth-context.tsx)
- [auth-service.ts](/C:/Projetos/admin-v2-web/src/features/auth/services/auth-service.ts)
- [auth-session.ts](/C:/Projetos/admin-v2-web/src/features/auth/services/auth-session.ts)
- [auth-tab-storage.ts](/C:/Projetos/admin-v2-web/src/features/auth/services/auth-tab-storage.ts)
- [tenant-context.tsx](/C:/Projetos/admin-v2-web/src/contexts/tenant-context.tsx)
- [session-lifecycle-context.tsx](/C:/Projetos/admin-v2-web/src/contexts/session-lifecycle-context.tsx)
- [http-client.ts](/C:/Projetos/admin-v2-web/src/services/http/http-client.ts)

## Login
Fluxo atual:
1. frontend envia credenciais para `/api/auth/login`;
2. o backend bridge autentica contra a API real;
3. o app grava um cookie HTTP-only assinado;
4. o `AuthProvider` materializa a sessão no cliente.

O fluxo também suporta autenticação em duas etapas:
- o login pode retornar `requiresTwoFactor`;
- o estado pendente fica em `sessionStorage`;
- o usuário envia o código e completa a autenticação.

## Cookie de sessão
O v2 usa cookie assinado pelo próprio app:
- nome: `admin_v2_web_session`
- `httpOnly`
- `sameSite: lax`
- `secure` condicionado ao ambiente

O cookie armazena:
- `token`
- `currentTenantId`
- `currentUserId`

## Estado sensível no cliente
O app mantém poucos dados sensíveis no browser, principalmente:
- tenant ativo;
- login pendente de 2FA;
- marcadores de sessão/autenticação;
- marcadores de expiração e atividade.

Na operação de logout, o v2 limpa:
- `sessionStorage` sensível;
- chaves sensíveis de `localStorage`;
- cache do dashboard associado ao tenant.

## Multiempresa
No legado, o tenant ativo era carregado com forte dependência de `window.name`, sessão PHP e `id_empresa`.

No v2, o tenant ativo está em:
- `AuthSession.currentTenant`
- `TenantProvider`
- cookie assinado + bridges da API

Quando o usuário troca de empresa:
1. o app chama `switchTenant`;
2. a sessão autenticada é reemitida com novo tenant;
3. o `TenantProvider` atualiza o contexto;
4. a navegação é reposicionada.

## Multiabas
O v2 já trata estado multiabas de forma explícita.

Pontos principais:
- existe um `tab id` próprio por aba;
- atividade global e encerramento de sessão são propagados por `localStorage`;
- perda de sessão em uma aba pode refletir nas demais.

Chaves relevantes:
- `admin-v2-web:session-activity-global`
- `admin-v2-web:session-end-global`
- `admin-v2-web:session-tab-id`

## Expiração e aviso de sessão
O legado já tinha um fluxo robusto de sessão. O v2 replica esse comportamento no cliente:
- aviso antes de expirar;
- contador regressivo;
- opção de continuar sessão;
- modal final bloqueante quando a sessão morre.

Além do modal, quando a sessão entra no estado encerrado o frontend invalida imediatamente o estado autenticado local e desmonta o shell protegido. Isso evita navegação residual mesmo se o modal for removido manualmente do DOM.

Tempos padrão atuais:
- inatividade: `7200s`
- aviso: `120s`

Também há interceptação automática de `401` no `httpClient`, que dispara o fluxo global de perda de sessão.

## Papel das bridges `app/api/*`
As rotas bridge fazem:
- leitura da sessão autenticada;
- propagação de token;
- propagação de `tenantId`;
- adaptação do contrato frontend x `api-v3`.

Isso substitui, no v2, a função que no legado era feita por controllers PHP locais.
