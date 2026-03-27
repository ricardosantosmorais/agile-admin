# Admin v2 Web - DocumentaÃ§Ã£o

## Objetivo
Esta pasta documenta a arquitetura, fluxos, padrÃµes e decisÃµes do `admin-v2-web`.

O objetivo Ã© duplo:
- dar contexto tÃ©cnico para evoluÃ§Ã£o do projeto;
- formar base para onboarding, validaÃ§Ã£o funcional e futura apresentaÃ§Ã£o do Admin v2.

## Baseline operacional do repositÃ³rio
As regras operacionais para agentes e contribuiÃ§Ãµes automatizadas estÃ£o em [AGENTS.md](/C:/Projetos/admin-v2-web/AGENTS.md).

Esse arquivo define:
- fluxo padrÃ£o de implementaÃ§Ã£o;
- regras de arquitetura;
- critÃ©rios de migraÃ§Ã£o do legado;
- cobertura mÃ­nima de testes;
- definiÃ§Ã£o de pronto do repositÃ³rio.

## RelaÃ§Ã£o com o legado
O legado em `C:\Projetos\admin\docs` continua sendo a referÃªncia histÃ³rica de regras de negÃ³cio, permissÃµes e comportamento operacional.

O v2 reaproveita a mesma base de produto, mas com outra arquitetura:
- Next.js App Router no frontend;
- bridges de API em `app/api/*`;
- autenticaÃ§Ã£o e tenant context gerenciados no prÃ³prio app;
- componentes compartilhados para listas, formulÃ¡rios, modais e sessÃ£o.

## Leitura recomendada
1. [01 - VisÃ£o Geral](/C:/Projetos/admin-v2-web/docs/01-visao-geral.md)
2. [02 - Stack e ExecuÃ§Ã£o](/C:/Projetos/admin-v2-web/docs/02-stack-e-execucao.md)
3. [03 - AutenticaÃ§Ã£o, SessÃ£o e Multiempresa](/C:/Projetos/admin-v2-web/docs/03-autenticacao-sessao-multiempresa.md)
4. [04 - Acesso, Menu e NavegaÃ§Ã£o](/C:/Projetos/admin-v2-web/docs/04-acesso-menu-navegacao.md)
5. [05 - Arquitetura Frontend e PadrÃµes](/C:/Projetos/admin-v2-web/docs/05-arquitetura-frontend-padroes.md)
6. [06 - MÃ³dulos e Cobertura Atual](/C:/Projetos/admin-v2-web/docs/06-modulos-e-cobertura-atual.md)
7. [07 - DiferenÃ§as para o Legado](/C:/Projetos/admin-v2-web/docs/07-diferencas-para-o-legado.md)
8. [08 - Mapa do RepositÃ³rio](/C:/Projetos/admin-v2-web/docs/08-mapa-do-repositorio.md)
9. [09 - Bridges app/api](/C:/Projetos/admin-v2-web/docs/09-bridges-app-api.md)
10. [10 - EstratÃ©gia de Testes](/C:/Projetos/admin-v2-web/docs/10-estrategia-de-testes.md)
11. [11 - Roteiro de ApresentaÃ§Ã£o](/C:/Projetos/admin-v2-web/docs/11-roteiro-apresentacao-admin-v2.md)
12. [12 - CatÃ¡logo de Componentes Compartilhados](/C:/Projetos/admin-v2-web/docs/12-catalogo-componentes-compartilhados.md)
13. [13 - MÃ³dulo Clientes](/C:/Projetos/admin-v2-web/docs/13-modulo-clientes.md)
14. [14 - MÃ³dulo UsuÃ¡rios](/C:/Projetos/admin-v2-web/docs/14-modulo-usuarios.md)
15. [15 - MÃ³dulo Administradores](/C:/Projetos/admin-v2-web/docs/15-modulo-administradores.md)
16. [16 - MÃ³dulo Vendedores](/C:/Projetos/admin-v2-web/docs/16-modulo-vendedores.md)
17. [17 - MÃ³dulo Banners](/C:/Projetos/admin-v2-web/docs/17-modulo-banners.md)
18. [18 - MÃ³dulo NotificaÃ§Ãµes App e Avise-me](/C:/Projetos/admin-v2-web/docs/18-modulo-notificacoes-app-e-aviseme.md)
19. [19 - MÃ³dulo Cupons Desconto](/C:/Projetos/admin-v2-web/docs/19-modulo-cupons-desconto.md)
20. [20 - MÃ³dulo Combos](/C:/Projetos/admin-v2-web/docs/20-modulo-combos.md)
21. [21 - MÃ³dulo PromoÃ§Ãµes Estruturadas](/C:/Projetos/admin-v2-web/docs/21-modulo-promocoes-estruturadas.md)
22. [22 - MÃ³dulos Complementares de Pessoas](/C:/Projetos/admin-v2-web/docs/22-modulo-pessoas-complementares.md)
23. [24 - MÃ³dulo LogÃ­stica BÃ¡sica](/C:/Projetos/admin-v2-web/docs/24-modulo-logistica-basica.md)
24. [25 - MÃ³dulo Formas de Entrega](/C:/Projetos/admin-v2-web/docs/25-modulo-formas-de-entrega.md)
25. [26 - Cadastros Lineares Base](/C:/Projetos/admin-v2-web/docs/26-cadastros-lineares-base.md)
26. [27 - MÃ³dulo Limites de CrÃ©dito](/C:/Projetos/admin-v2-web/docs/27-modulo-financeiro-credito.md)
27. [28 - Módulos Financeiros de Pagamento](/C:/Projetos/admin-v2-web/docs/28-modulo-financeiro-pagamentos.md)
28. [29 - Módulo Preços e Estoques](/C:/Projetos/admin-v2-web/docs/29-modulo-precos-estoques.md)
29. [ADRs](/C:/Projetos/admin-v2-web/docs/adr/README.md)

## Fontes principais usadas
- `C:\Projetos\admin\docs\README.md`
- `C:\Projetos\admin\docs\03-arquitetura-high-level.md`
- `C:\Projetos\admin\docs\09-seguranca-autorizacao.md`
- `C:\Projetos\admin-v2-web\package.json`
- `C:\Projetos\admin-v2-web\src\contexts\auth-context.tsx`
- `C:\Projetos\admin-v2-web\src\contexts\session-lifecycle-context.tsx`
- `C:\Projetos\admin-v2-web\src\contexts\tenant-context.tsx`
- `C:\Projetos\admin-v2-web\src\components\navigation\menu-items.ts`
- `C:\Projetos\admin-v2-web\src\components\shell\topbar.tsx`
- `C:\Projetos\admin-v2-web\src\components\shell\sidebar.tsx`
- `C:\Projetos\admin-v2-web\src\components\crud-base\crud-form-page.tsx`
- `C:\Projetos\admin-v2-web\src\components\crud-base\crud-list-page.tsx`

