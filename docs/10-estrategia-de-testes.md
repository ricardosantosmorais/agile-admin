# 10 - Estratégia de Testes

## Estado atual
O repositório agora possui uma base inicial de testes automatizados com:
- `Vitest`;
- `Testing Library`;
- ambiente `jsdom`;
- setup compartilhado em `src/test/setup.ts`;
- utilitário de render em `src/test/render.tsx`.

Scripts disponíveis:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:watch`
- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`

## Objetivo da base
Padronizar um caminho simples para que cada nova migração entre no projeto com cobertura mínima sem precisar reinventar setup a cada módulo.

## Padrão recomendado por feature

### 1. Teste unitário
Usar para:
- mappers;
- normalizadores;
- validadores;
- helpers;
- regras de transformação de payload.

Local preferencial:
- `src/features/<feature>/services/*.test.ts`
- `src/lib/*.test.ts`

### 2. Teste de componente / integração leve
Usar para:
- comportamento condicional de formulário;
- filtros;
- modais locais;
- renderização crítica baseada em configuração;
- componentes compartilhados.

Local preferencial:
- `src/features/<feature>/components/*.test.tsx`
- `src/components/**/*.test.tsx`

## Utilitários compartilhados

### `src/test/setup.ts`
Carrega extensões globais do ambiente de teste.

### `src/test/render.tsx`
Fornece `renderWithProviders` com `I18nProvider`, evitando repetição de boilerplate nos testes de componente.

## Regra operacional para novas migrações
Toda nova feature deve entrar, no mínimo, com:
- 1 teste unitário de mapper, normalizador ou payload;
- 1 teste de componente quando houver comportamento relevante de UI.

## E2E
O repositório agora possui uma base inicial de Playwright com:
- config em `playwright.config.ts`;
- setup autenticado em `e2e/auth.setup.ts`;
- helper de login em `e2e/helpers/auth.ts`;
- storage state em `playwright/.auth/user.json`;
- primeiro smoke de `Banners` em `e2e/banners.spec.ts`.

Variáveis de ambiente esperadas para fluxo autenticado:
- `PLAYWRIGHT_AUTH_EMAIL`
- `PLAYWRIGHT_AUTH_PASSWORD`
- `PLAYWRIGHT_AUTH_CODE` quando houver desafio em duas etapas

Próximas suítes devem priorizar:
- login;
- troca de tenant;
- expiração de sessão;
- fluxo feliz de listagem e formulário dos módulos migrados.

## Ordem de execução recomendada no dia a dia
1. `npm run test`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`

## Observação
A ausência de E2E não volta a justificar ausência de testes automatizados em feature nova. A base unitária e de componente já é parte do baseline do projeto.
