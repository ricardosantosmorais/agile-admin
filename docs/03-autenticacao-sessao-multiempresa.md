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
- [auth-context.tsx](../src/contexts/auth-context.tsx)
- [auth-service.ts](../src/features/auth/services/auth-service.ts)
- [auth-session.ts](../src/features/auth/services/auth-session.ts)
- [auth-tab-storage.ts](../src/features/auth/services/auth-tab-storage.ts)
- [tenant-context.tsx](../src/contexts/tenant-context.tsx)
- [session-lifecycle-context.tsx](../src/contexts/session-lifecycle-context.tsx)
- [http-client.ts](../src/services/http/http-client.ts)

## Login
Fluxo atual:
1. frontend envia credenciais para `/api/auth/login`;
2. o backend bridge autentica contra a API real;
3. o app grava um cookie HTTP-only assinado;
4. o `AuthProvider` materializa a sessão no cliente.

Comportamento de entrada:
- acessar `/` sem sessão válida redireciona para `/login`, sem parâmetros extras;
- acessar `/` com sessão válida redireciona para `/dashboard`;
- acessar `/login` com sessão válida redireciona diretamente para `/dashboard`;
- acessar `/login` sem sessão válida não deve disparar probe inicial de `/api/auth/session` quando a aba está limpa e não existe 2FA pendente.

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
- o tenant ativo da aba é mantido em `sessionStorage` e enviado nas bridges por `X-Admin-V2-Tenant-Id`;
- bridges que recebem tenant explícito no payload devem priorizar `payload > header da aba > cookie`, evitando que o cookie compartilhado entre abas sobrescreva o contexto visual da aba.
- chamadas client-side para `app/api/*` devem passar por `httpClient` ou `fetchWithTenantContext`, inclusive uploads e downloads que usam `FormData` ou `blob`.

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

Tempos padrão atuais:
- inatividade: `7200s`
- aviso: `120s`

Também há interceptação automática de `401` no `httpClient`, que dispara o fluxo global de perda de sessão.
Respostas `403` com código explícito `TENANT_CONTEXT_INVALID` seguem o mesmo fluxo de modal final, preservando 403 comum de permissão como erro operacional da tela.

## Comportamento final de inatividade
- após 2 horas sem atividade, o app abre apenas o modal de aviso;
- o aviso exibe contagem regressiva de 2 minutos e permite somente continuar a sessão;
- ao fim do contador, o app encerra a sessão remota, limpa a persistência sensível local e bloqueia novas requisições protegidas no cliente;
- a visão atual da sessão fica congelada em memória até o usuário ir para o login;
- a tela atual permanece visível e intacta sob um modal final bloqueante, sem redirect automático e sem desmontar o conteúdo que já estava carregado;
- reload da página, nova navegação protegida ou ação explícita do usuário levam para `/login`;
- o congelamento da tela vale apenas enquanto a aba continua viva; após `F5`, a memória local do estado congelado some e o app deve redirecionar imediatamente para o login.

## Plano de validação recomendado
Checklist funcional para confirmar que o fluxo ficou estável:

1. Abrir uma tela operacional com conteúdo dinâmico já carregado, por exemplo `Editor SQL`, `Pedidos` ou uma edição tabulada de catálogo.
2. Ficar inativo até abrir o modal de aviso de 2 minutos.
3. Confirmar que, durante o aviso:
   - a tela de fundo continua igual;
   - nenhuma área dinâmica é desmontada;
   - não há redirect para `/login`.
4. Não clicar em continuar e aguardar o modal final de sessão encerrada.
5. Confirmar que, após o encerramento:
   - o conteúdo carregado continua visível atrás do modal;
   - não aparece estado vazio, erro 401 visível ou tela quebrada atrás do modal;
   - não há loop de chamadas para `/api/auth/logout`;
   - não há chamadas protegidas adicionais como notificações, dashboard ou dados da tela.
6. Pressionar `F5` com o modal final aberto e confirmar que o app vai direto para `/login`, sem tentar remontar a tela protegida.
7. Clicar em `Ir para login` e confirmar que só então ocorre a navegação para `/login`.
8. Repetir o teste com duas abas abertas para validar sincronização multiabas:
   - aba A expira;
   - aba B deve mostrar o modal final sem desmontar a tela de fundo.

## Papel das bridges `app/api/*`
As rotas bridge fazem:
- leitura da sessão autenticada;
- propagação de token;
- propagação de `tenantId`;
- adaptação do contrato frontend x `api-v3`.

Isso substitui, no v2, a função que no legado era feita por controllers PHP locais.
