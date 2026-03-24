# ADR-001 - Next.js App Router como base do frontend

## Status
Aceita

## Contexto
O legado foi construido com frontend, backend PHP e renderizacao acoplados na mesma aplicacao.

No v2, era necessario:
- separar o frontend da estrutura antiga;
- permitir navegacao moderna e componentizacao real;
- organizar layout, autenticacao, contexto de tenant e modulos de forma previsivel;
- preparar o projeto para evolucao incremental por modulo.

## Decisao
O `admin-v2-web` adota `Next.js` com `App Router` como base do frontend.

## Consequencias

### Positivas
- layouts protegidos e publicos ficam declarativos;
- rotas de pagina e rotas `app/api` convivem no mesmo projeto;
- `server components` e `client components` podem ser combinados de forma controlada;
- contexto de autenticacao e tenant pode ser encapsulado na arvore da aplicacao;
- a arquitetura suporta migracao modulo a modulo sem depender da estrutura do legado.

### Custos
- exige disciplina clara entre client e server;
- erros de boundary entre componentes client-side e server-side precisam ser tratados cedo;
- a equipe precisa dominar `App Router`, `Route Handlers` e contexto no frontend.

## Impacto
Todas as decisoes seguintes do v2 partem desse ponto:
- bridges `app/api`;
- contextos globais;
- paginas protegidas;
- padroes de CRUD e listagem.
