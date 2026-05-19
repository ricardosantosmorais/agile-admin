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

## Validação visual de paridade com o legado

Toda migração legado -> v2 deve terminar com uma validação visual comparativa contra a tela ou fluxo equivalente no legado. O objetivo não é copiar a estrutura antiga, mas confirmar que a experiência entregue preserva o comportamento operacional esperado.

Essa validação deve cobrir, no mínimo:
- layout geral, densidade e hierarquia visual;
- labels, botões, ações por linha, ações em massa e modais;
- estados de loading, vazio, erro, disabled e sucesso;
- permissões visíveis e bloqueios funcionais;
- light/dark quando a tela existir nos dois temas;
- desktop e mobile quando o fluxo for responsivo;
- PT/EN quando houver strings novas ou tela traduzida.

Ao fechar a fatia, registrar no batch, handoff ou documento do módulo:
- quais cenários visuais foram comparados com o legado;
- evidências ou prints quando aplicável;
- diferenças intencionais do padrão v2;
- pendências reais quando a validação for bloqueada por ambiente, credencial, tenant, dado operacional ou contrato backend.

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

## Ordem de execucao recomendada no dia a dia
Durante uma rodada de desenvolvimento, nao rode a suite completa por reflexo. Comece pelo menor conjunto que prova a fatia atual:

1. testes unitarios/componentes dos arquivos, services, rotas e modulos tocados;
2. `lint` e `typecheck` no menor escopo tecnicamente viavel, quando o ferramental permitir;
3. validação visual ou E2E focada apenas quando a mudança tocar fluxo de tela relevante.

Em migrações legado -> v2, a validação visual comparativa com o legado é obrigatória no fechamento da fatia, mesmo quando os testes automatizados já estiverem verdes.

Reservar `npm run test`, lint global, typecheck global e `npm run build` para:
- fechamento de um modulo;
- publicacao, merge ou PR;
- mudancas transversais;
- pedido explicito do programador;
- suspeita concreta de regressao fora da rodada.

`npm run build` nao faz parte do ciclo comum de cada fatia pequena. Ele deve entrar quando houver risco real em rotas, App Router, SSR, bundling, providers, i18n ampla, shareds de alto impacto ou no fechamento/publicacao de modulo.

## Observação
A ausência de E2E não volta a justificar ausência de testes automatizados em feature nova. A base unitária e de componente já é parte do baseline do projeto.
