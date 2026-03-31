# Admin v2 Web - Documentação

## Objetivo
Esta pasta documenta a arquitetura, fluxos, padrões e decisões do `admin-v2-web`.

O objetivo é duplo:
- dar contexto técnico para evolução do projeto;
- formar base para onboarding, validação funcional e futura apresentação do Admin v2.

## Baseline operacional do repositório
As regras operacionais para agentes e contribuições automatizadas estão em [AGENTS.md](../AGENTS.md).

Esse arquivo define:
- fluxo padrão de implementação;
- regras de arquitetura;
- critérios de migração do legado;
- cobertura mínima de testes;
- definição de pronto do repositório.

## Relação com o legado
O legado em `C:\Projetos\admin\docs` continua sendo a referência histórica de regras de negócio, permissões e comportamento operacional.

O v2 reaproveita a mesma base de produto, mas com outra arquitetura:
- Next.js App Router no frontend;
- bridges de API em `app/api/*`;
- autenticação e tenant context gerenciados no próprio app;
- componentes compartilhados para listas, formulários, modais e sessão.

## Leitura recomendada
1. [01 - Visão Geral](01-visao-geral.md)
2. [02 - Stack e Execução](02-stack-e-execucao.md)
3. [03 - Autenticação, Sessão e Multiempresa](03-autenticacao-sessao-multiempresa.md)
4. [04 - Acesso, Menu e Navegação](04-acesso-menu-navegacao.md)
5. [05 - Arquitetura Frontend e Padrões](05-arquitetura-frontend-padroes.md)
6. [06 - Módulos e Cobertura Atual](06-modulos-e-cobertura-atual.md)
7. [07 - Diferenças para o Legado](07-diferencas-para-o-legado.md)
8. [08 - Mapa do Repositório](08-mapa-do-repositorio.md)
9. [09 - Bridges app/api](09-bridges-app-api.md)
10. [10 - Estratégia de Testes](10-estrategia-de-testes.md)
11. [11 - Roteiro de Apresentação](11-roteiro-apresentacao-admin-v2.md)
12. [12 - Catálogo de Componentes Compartilhados](12-catalogo-componentes-compartilhados.md)
13. [13 - Módulo Clientes](13-modulo-clientes.md)
14. [14 - Módulo Usuários](14-modulo-usuarios.md)
15. [15 - Módulo Administradores](15-modulo-administradores.md)
16. [16 - Módulo Vendedores](16-modulo-vendedores.md)
17. [17 - Módulo Banners](17-modulo-banners.md)
18. [18 - Módulo Notificações App e Avise-me](18-modulo-notificacoes-app-e-aviseme.md)
19. [19 - Módulo Cupons Desconto](19-modulo-cupons-desconto.md)
20. [20 - Módulo Combos](20-modulo-combos.md)
21. [21 - Módulo Promoções Estruturadas](21-modulo-promocoes-estruturadas.md)
22. [22 - Módulos Complementares de Pessoas](22-modulo-pessoas-complementares.md)
23. [24 - Módulo Logística Básica](24-modulo-logistica-basica.md)
24. [25 - Módulo Formas de Entrega](25-modulo-formas-de-entrega.md)
25. [26 - Cadastros Lineares Base](26-cadastros-lineares-base.md)
26. [27 - Módulo Limites de Crédito](27-modulo-financeiro-credito.md)
27. [28 - Módulos Financeiros de Pagamento](28-modulo-financeiro-pagamentos.md)
28. [29 - Módulo Preços e Estoques](29-modulo-precos-estoques.md)
29. [ADRs](adr/README.md)

## Fontes principais usadas
- `C:\Projetos\admin\docs\README.md`
- `C:\Projetos\admin\docs\03-arquitetura-high-level.md`
- `C:\Projetos\admin\docs\09-seguranca-autorizacao.md`
- `../package.json`
- `../src/contexts/auth-context.tsx`
- `../src/contexts/session-lifecycle-context.tsx`
- `../src/contexts/tenant-context.tsx`
- `../src/components/navigation/menu-items.ts`
- `../src/components/shell/topbar.tsx`
- `../src/components/shell/sidebar.tsx`
- `../src/components/crud-base/crud-form-page.tsx`
- `../src/components/crud-base/crud-list-page.tsx`
