# Admin v2 Web - Documentação

## Objetivo

Esta pasta documenta a arquitetura, os fluxos, os padrões compartilhados e o estado atual da migração do `admin-v2-web`.

O objetivo é:

- dar contexto técnico para manutenção e novas entregas;
- registrar decisões arquiteturais e operacionais do v2;
- apoiar onboarding, QA e comparação com o legado.

## Baseline operacional do repositório

As regras operacionais para agentes e contribuições automatizadas estão em [../AGENTS.md](../AGENTS.md).

Esse arquivo define:

- fluxo padrão de implementação;
- regras de arquitetura e migração;
- cobertura mínima de testes;
- checklist de revisão;
- definition of done do repositório.

## Guia de design

O guia de design de produto, UX e UI do Admin v2 está em [../DESIGN.md](../DESIGN.md).

Use esse arquivo como ponto de entrada para padrões visuais, composição de telas, responsividade, dark mode, i18n, acessibilidade e critérios de migração do legado.

O guia técnico de tokens, componentes, estados e classes visuais está em [Design System Técnico](./design-system-tecnico.md).

## Relação com o legado

O legado em `C:\Projetos\admin` continua sendo a referência funcional de regras de negócio, permissões e comportamento operacional.

O v2 reaproveita a mesma base de produto, mas com outra arquitetura:

- Next.js App Router no frontend;
- bridges em `app/api/*`;
- autenticação, tenant e sessão tratados no próprio app;
- i18n local;
- componentes compartilhados para listas, formulários, modais, sessão e feedback.

## Leitura recomendada

1. [01 - Visão Geral](./01-visao-geral.md)
2. [02 - Stack e Execução](./02-stack-e-execucao.md)
3. [03 - Autenticação, Sessão e Multiempresa](./03-autenticacao-sessao-multiempresa.md)
4. [04 - Acesso, Menu e Navegação](./04-acesso-menu-navegacao.md)
5. [05 - Arquitetura Frontend e Padrões](./05-arquitetura-frontend-padroes.md)
6. [06 - Módulos e Cobertura Atual](./06-modulos-e-cobertura-atual.md)
7. [07 - Diferenças para o Legado](./07-diferencas-para-o-legado.md)
8. [08 - Mapa do Repositório](./08-mapa-do-repositorio.md)
9. [09 - Bridges app/api](./09-bridges-app-api.md)
10. [10 - Estratégia de Testes](./10-estrategia-de-testes.md)
11. [11 - Roteiro de Apresentação](./11-roteiro-apresentacao-admin-v2.md)
12. [12 - Catálogo de Componentes Compartilhados](./12-catalogo-componentes-compartilhados.md)
13. [Design System Técnico](./design-system-tecnico.md)
14. [13 - Módulo Clientes](./13-modulo-clientes.md)
15. [14 - Módulo Usuários](./14-modulo-usuarios.md)
16. [15 - Módulo Administradores](./15-modulo-administradores.md)
17. [16 - Módulo Vendedores](./16-modulo-vendedores.md)
18. [17 - Módulo Banners](./17-modulo-banners.md)
19. [18 - Módulo Notificações App e Avise-me](./18-modulo-notificacoes-app-e-aviseme.md)
20. [19 - Módulo Cupons Desconto](./19-modulo-cupons-desconto.md)
21. [20 - Módulo Combos](./20-modulo-combos.md)
22. [21 - Módulo Promoções Estruturadas](./21-modulo-promocoes-estruturadas.md)
23. [22 - Módulo Pessoas Complementares](./22-modulo-pessoas-complementares.md)
24. [24 - Módulo Logística Básica](./24-modulo-logistica-basica.md)
25. [25 - Módulo Formas de Entrega](./25-modulo-formas-de-entrega.md)
26. [26 - Cadastros Lineares Base](./26-cadastros-lineares-base.md)
27. [27 - Módulo Limites de Crédito](./27-modulo-financeiro-credito.md)
28. [28 - Módulos Financeiros de Pagamento](./28-modulo-financeiro-pagamentos.md)
29. [29 - Módulo Preços e Estoques](./29-modulo-precos-estoques.md)
30. [30 - Uploads, Assets e S3](./30-upload-assets-s3.md)
31. [31 - Módulo Produtos](./31-modulo-produtos.md)
32. [32 - Módulo Pedidos](./32-modulo-pedidos.md)
33. [33 - Módulo Ferramentas > Editor SQL](./33-modulo-ferramentas-editor-sql.md)
34. [34 - Módulo Relatórios v2](./34-modulo-relatorios-v2.md)
35. [35 - Módulo Configurações > Clientes](./35-modulo-configuracoes-clientes.md)
36. [36 - Módulo Configurações > Entregas](./36-modulo-configuracoes-entregas.md)
37. [37 - Módulo Configurações > Geral](./37-modulo-configuracoes-geral.md)
38. [38 - Módulo Configurações > Início](./38-modulo-configuracoes-inicio.md)
39. [39 - Módulo Configurações > Layout](./39-modulo-configuracoes-layout.md)
40. [40 - Módulo Configurações > Pedidos, Preços, Produtos e Vendedores](./40-modulo-configuracoes-pedidos-precos-produtos-vendedores.md)
41. [41 - Módulo Configurações > Assistentes e Parâmetros](./41-modulo-configuracoes-assistentes-e-parametros.md)
42. [42 - Módulo Perfis](./42-modulo-perfis.md)
43. [43 - Módulo Ferramentas > HTTP Client](./43-modulo-ferramentas-http-client.md)
44. [Módulo Integrações > Financeiro](./44-modulo-integracao-financeiro.md)
45. [Módulo Integrações > Gateways de Pagamento](./45-modulo-integracoes-gateways-pagamento.md)
46. [Módulo Dashboard Agile E-commerce](./46-modulo-dashboard-agileecommerce.md)
47. [Proposta do Dashboard Root Comercial v2](./47-dashboard-root-comercial-v2.md)
48. [Dashboard da Empresa](./48-dashboard-empresa.md)
49. [Módulo Integrações > Clientes e Marketing](./49-modulo-integracoes-clientes-marketing.md)
50. [Módulo Agile Store](./50-modulo-agile-store.md)
51. [Módulo SAC Admin](./51-modulo-sac-admin.md)
52. [Módulo Catálogos Digitais](./52-modulo-catalogos-digitais.md)
53. [ADRs](./adr/README.md)

## Fontes principais usadas

- `../package.json`
- `../app`
- `../src/components`
- `../src/contexts`
- `../src/features`
- `../src/providers`
- `../src/services`
- `../src/lib`
- `C:\Projetos\admin\docs`

## Regra prática de atualização

Sempre que houver mudança real de arquitetura, ambiente, fluxo operacional, módulo migrado ou componente compartilhado:

- atualizar o documento de módulo correspondente;
- revisar [06 - Módulos e Cobertura Atual](./06-modulos-e-cobertura-atual.md);
- revisar este índice se um documento novo entrar em `docs/`.
