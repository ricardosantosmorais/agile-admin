# ADR-001 - Next.js App Router como base do frontend

## Status
Aceita

## Contexto
O legado foi construído com frontend, backend PHP e renderização acoplados na mesma aplicação.

No v2, era necessário:
- separar o frontend da estrutura antiga;
- permitir navegação moderna e componentização real;
- organizar layout, autenticação, contexto de tenant e módulos de forma previsível;
- preparar o projeto para evolução incremental por módulo.

## Decisão
O `admin-v2-web` adota `Next.js` com `App Router` como base do frontend.

## Consequências

### Positivas
- layouts protegidos e públicos ficam declarativos;
- rotas de página e rotas `app/api` convivem no mesmo projeto;
- `server components` e `client components` podem ser combinados de forma controlada;
- contexto de autenticação e tenant pode ser encapsulado na árvore da aplicação;
- a arquitetura suporta migração módulo a módulo sem depender da estrutura do legado.

### Custos
- exige disciplina clara entre client e server;
- erros de boundary entre componentes client-side e server-side precisam ser tratados cedo;
- a equipe precisa dominar `App Router`, `Route Handlers` e contexto no frontend.

## Impacto
Todas as decisões seguintes do v2 partem desse ponto:
- bridges `app/api`;
- contextos globais;
- páginas protegidas;
- padrões de CRUD e listagem.
