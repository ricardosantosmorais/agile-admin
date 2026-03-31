# Admin v2 Web

Painel administrativo em Next.js para a nova geraÃ§Ã£o do admin.

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

### UnitÃ¡rios e componente
- `npm run test`

### E2E com Playwright
InstalaÃ§Ã£o inicial do browser:
- `npm run test:e2e:install`

ExecuÃ§Ã£o padrÃ£o:
- `npm run test:e2e`

ExecuÃ§Ã£o com navegador visÃ­vel:
- `npm run test:e2e:headed`

ExecuÃ§Ã£o com UI do Playwright:
- `npm run test:e2e:ui`

VariÃ¡veis Ãºteis para o fluxo autenticado:
- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE`
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_PORT`
- `PLAYWRIGHT_SKIP_WEBSERVER=1`

O Playwright jÃ¡ carrega `.env.local` automaticamente. Para uso local compartilhado, a recomendaÃ§Ã£o Ã©:
- manter credenciais reais apenas em `.env.local`;
- usar `.env.example` como referÃªncia das chaves esperadas;
- deixar `PLAYWRIGHT_AUTH_CODE` vazio no ambiente local quando nÃ£o houver 2FA.

Exemplo no PowerShell:

```powershell
$env:PLAYWRIGHT_AUTH_EMAIL='ricardo@empresa.com.br'
$env:PLAYWRIGHT_AUTH_PASSWORD='123456'
npm run test:e2e
```

## CI de PR

O repositÃ³rio estÃ¡ preparado para rodar `lint`, `typecheck`, `build` e Playwright em PRs no GitHub Actions.

Smoke branch de CI criada para validar a pipeline de pull request.

Para os E2Es autenticados no CI, configure estes secrets no repositÃ³rio:
- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE` opcional
- `PLAYWRIGHT_AUTH_TENANT_ID` opcional

Na execuÃ§Ã£o de PR, o pipeline publica como artifact:
- relatÃ³rio HTML do Playwright
- vÃ­deos dos testes
- screenshots de falha
- traces

## Deploy para Amplify

O deploy para o Amplify acontece pelo prÃƒÂ³prio continuous deployment da AWS, desde que o app jÃƒÂ¡ esteja conectado ao repositÃƒÂ³rio e ÃƒÂ  branch publicada.

Fluxo recomendado:
- o GitHub Actions valida `lint`, `typecheck`, `build` e Playwright na PR;
- a branch publicada deve ter branch protection com os checks obrigatÃƒÂ³rios;
- depois do merge aprovado, o Amplify detecta o novo commit na branch e faz o deploy automaticamente.

Secrets de E2E que continuam necessÃƒÂ¡rios no GitHub Actions:
- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE` opcional
- `PLAYWRIGHT_AUTH_TENANT_ID` opcional

## Estrutura

- `app/`: rotas e layouts do Next
- `src/screens/`: telas do admin
- `src/components/`: UI e shell
- `src/contexts/`: auth, tenant e UI
- `src/services/`: camada de dados

## Estado atual

- login, dashboard, administradores, clientes, relatÃ³rios e configuraÃ§Ãµes jÃ¡ estÃ£o no App Router
- shell principal refinado
- dados ainda em camada fake, prontos para integraÃ§Ã£o com a `api-v3`

## Observabilidade

O projeto agora possui integra??o base com Sentry para Next.js App Router.

Vari?veis principais:
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`

Regras pr?ticas:
- sem `SENTRY_DSN`, o backend n?o envia eventos para o Sentry;
- sem `NEXT_PUBLIC_SENTRY_DSN`, o frontend n?o envia eventos para o Sentry;
- sem `SENTRY_AUTH_TOKEN`, os erros continuam sendo enviados, mas o build n?o sobe sourcemaps;
- login, logout, troca de tenant e expira??o de sess?o atualizam automaticamente o contexto de usu?rio e tenant no Sentry.
