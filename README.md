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
