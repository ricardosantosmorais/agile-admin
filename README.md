# Admin v2 Web

Painel administrativo em Next.js para a nova geração do admin.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- TypeScript

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`
- `npm run test:e2e:install`

## Testes manuais

### Unitários e componente

- `npm run test`

### E2E com Playwright

Instalação inicial do browser:

- `npm run test:e2e:install`

Execução padrão:

- `npm run test:e2e`

Execução com navegador visível:

- `npm run test:e2e:headed`

Execução com UI do Playwright:

- `npm run test:e2e:ui`

Variáveis úteis para o fluxo autenticado:

- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE`
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_PORT`
- `PLAYWRIGHT_SKIP_WEBSERVER=1`

O Playwright já carrega `.env.local` automaticamente. Para uso local compartilhado, a recomendação é:

- manter credenciais reais apenas em `.env.local`;
- usar `.env.example` como referência das chaves esperadas;
- deixar `PLAYWRIGHT_AUTH_CODE` vazio no ambiente local quando não houver 2FA.

Exemplo no PowerShell:

```powershell
$env:PLAYWRIGHT_AUTH_EMAIL='ricardo@empresa.com.br'
$env:PLAYWRIGHT_AUTH_PASSWORD='123456'
npm run test:e2e
```

## CI de PR

O repositório está preparado para rodar `lint`, `typecheck`, `build` e Playwright em PRs no GitHub Actions.

Smoke branch de CI criada para validar a pipeline de pull request.

Para os E2Es autenticados no CI, configure estes secrets no repositório:

- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE` opcional
- `PLAYWRIGHT_AUTH_TENANT_ID` opcional

Na execução de PR, o pipeline publica como artifact:

- relatório HTML do Playwright
- vídeos dos testes
- screenshots de falha
- traces

## Deploy para Amplify

O deploy para o Amplify acontece pelo próprio continuous deployment da AWS, desde que o app já esteja conectado ao repositório e à branch publicada.

Fluxo recomendado:

- o GitHub Actions valida `lint`, `typecheck`, `build` e Playwright na PR;
- a branch publicada deve ter branch protection com os checks obrigatórios;
- depois do merge aprovado, o Amplify detecta o novo commit na branch e faz o deploy automaticamente.

Secrets de E2E que continuam necessários no GitHub Actions:

- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE` opcional
- `PLAYWRIGHT_AUTH_TENANT_ID` opcional

### Ambiente SSR do Amplify

Para o `Next.js` com SSR e `app/api/*`, as variáveis configuradas no painel do Amplify não ficam disponíveis automaticamente no runtime do Next.

Por isso, o repositório possui um [amplify.yml](/C:/Projetos/admin-v2-web/amplify.yml) que copia as variáveis necessárias do ambiente de build para `.env.production` antes do `next build`.

Se uma variável de servidor estiver vazia no runtime publicado, conferir:

- se ela foi cadastrada no painel do Amplify;
- se a branch publicada recebeu novo deploy;
- se o `amplify.yml` do repositório foi aplicado no build;
- se a variável está incluída na lista exportada para `.env.production`.

## Estrutura

- `app/`: rotas e layouts do Next
- `src/screens/`: telas do admin
- `src/components/`: UI e shell
- `src/contexts/`: auth, tenant e UI
- `src/services/`: camada de dados

## Estado atual

- login, dashboard, administradores, clientes, relatórios e configurações já estão no App Router
- shell principal refinado
- dados ainda em camada fake, prontos para integração com a `api-v3`

## Observabilidade

O projeto agora possui integração base com Sentry para Next.js App Router.

Variáveis principais:

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`

Regras práticas:

- sem `SENTRY_DSN`, o backend não envia eventos para o Sentry;
- sem `NEXT_PUBLIC_SENTRY_DSN`, o frontend não envia eventos para o Sentry;
- sem `SENTRY_AUTH_TOKEN`, os erros continuam sendo enviados, mas o build não sobe sourcemaps;
- login, logout, troca de tenant e expiração de sessão atualizam automaticamente o contexto de usuário e tenant no Sentry.
