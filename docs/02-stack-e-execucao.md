# 02 - Stack e Execução

## Stack principal
Base observada em [../package.json](../package.json):

- Next.js 16 com App Router;
- React 19;
- TypeScript 5;
- Tailwind CSS 4;
- Lucide React para ícones;
- Monaco Editor para o Editor SQL;
- Tiptap para editor HTML;
- React Dropzone para upload;
- Recharts para gráficos;
- Sentry para observabilidade;
- Playwright para E2E;
- Vitest + Testing Library para testes unitários e de integração.

## Scripts disponíveis
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:watch`
- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`
- `npm run test:e2e:install`

## Como rodar localmente
1. Instalar dependências com `npm install`.
2. Preencher as variáveis do ambiente local em `.env.local`.
3. Executar `npm run dev`.
4. Abrir a aplicação no host/porta configurados pelo Next.

## Variáveis de ambiente

### Base do app e sessão
- `ADMIN_URL_API_V3`
- `AUTH_SESSION_SECRET`
- `AUTH_COOKIE_SECURE`

Observação:
- o v2 usa cookie assinado no próprio app, então `AUTH_SESSION_SECRET` deve ser tratado como segredo real em produção.

### Sentry
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_DEBUG`
- `NEXT_PUBLIC_SENTRY_DEBUG`

Uso:
- `NEXT_PUBLIC_SENTRY_DSN` habilita captura no navegador;
- `SENTRY_DSN` habilita captura server-side e edge;
- `SENTRY_AUTH_TOKEN` é necessário apenas para upload de sourcemaps no build.

### Playwright E2E
- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE`
- `PLAYWRIGHT_PORT`
- `PLAYWRIGHT_BASE_URL`

Uso:
- as credenciais servem para o bootstrap autenticado da suíte;
- `PLAYWRIGHT_BASE_URL` deve apontar para a URL onde o app está rodando no momento do teste.

### Uploads e S3
- `UPLOAD_DRIVER`
- `UPLOAD_S3_ACCESS_KEY_ID`
- `UPLOAD_S3_SECRET_ACCESS_KEY`
- `UPLOAD_S3_REGION`
- `UPLOAD_S3_PUBLIC_BUCKET`
- `UPLOAD_S3_PRIVATE_BUCKET`
- `UPLOAD_S3_PUBLIC_BASE_URL`

Observações:
- parte da infraestrutura de upload já está preparada para S3, mas o rollout completo ainda depende do fluxo do módulo;
- no legado, o bucket público e a URL pública costumam variar por tenant.

### APIs externas usadas por Ferramentas > Editor SQL
- `ADMIN_URL_API_PAINELB2B`
- `ADMIN_API_PAINELB2B_TOKEN`
- `ADMIN_URL_API_AGILESYNC`
- `ADMIN_API_AGILESYNC_TOKEN`

Uso:
- o Editor SQL não usa a `api-v3`;
- ele chama APIs externas legadas via bridge em `app/api/editor-sql/*`.

### Amplify SSR
- para deploy no AWS Amplify com SSR, as variáveis necessárias ao runtime server-side do Next precisam ser exportadas no build para `.env.production`;
- o repositório possui [../amplify.yml](../amplify.yml) para copiar as variáveis necessárias antes do `npm run build`;
- sem esse passo, rotas `app/api/*` podem subir com `process.env` vazio no runtime publicado, mesmo com a variável cadastrada no painel do Amplify.

## Validação mínima antes de subir mudanças
O ciclo mínimo esperado continua sendo:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Quando a tarefa tocar uma feature com cobertura existente:
- rodar também os testes unitários do módulo;
- rodar o E2E principal da feature, sempre que tecnicamente viável.
