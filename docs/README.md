# Admin v2 Web - DocumentaÃ§Ã£o

## Objetivo
Esta pasta documenta a arquitetura, os fluxos, os padrÃµes compartilhados e o estado atual da migraÃ§Ã£o do `admin-v2-web`.

O objetivo Ã©:
- dar contexto tÃ©cnico para manutenÃ§Ã£o e novas entregas;
- registrar decisÃµes arquiteturais e operacionais do v2;
- apoiar onboarding, QA e comparaÃ§Ã£o com o legado.

## Baseline operacional do repositÃ³rio
As regras operacionais para agentes e contribuiÃ§Ãµes automatizadas estÃ£o em [../AGENTS.md](../AGENTS.md).

Esse arquivo define:
- fluxo padrÃ£o de implementaÃ§Ã£o;
- regras de arquitetura e migraÃ§Ã£o;
- cobertura mÃ­nima de testes;
- checklist de revisÃ£o;
- definition of done do repositÃ³rio.

## RelaÃ§Ã£o com o legado
O legado em `C:\Projetos\admin` continua sendo a referÃªncia funcional de regras de negÃ³cio, permissÃµes e comportamento operacional.

O v2 reaproveita a mesma base de produto, mas com outra arquitetura:
- Next.js App Router no frontend;
- bridges em `app/api/*`;
- autenticaÃ§Ã£o, tenant e sessÃ£o tratados no prÃ³prio app;
- i18n local;
- componentes compartilhados para listas, formulÃ¡rios, modais, sessÃ£o e feedback.

## Leitura recomendada
1. [01 - VisÃ£o Geral](./01-visao-geral.md)
2. [02 - Stack e ExecuÃ§Ã£o](./02-stack-e-execucao.md)
3. [03 - AutenticaÃ§Ã£o, SessÃ£o e Multiempresa](./03-autenticacao-sessao-multiempresa.md)
4. [04 - Acesso, Menu e NavegaÃ§Ã£o](./04-acesso-menu-navegacao.md)
5. [05 - Arquitetura Frontend e PadrÃµes](./05-arquitetura-frontend-padroes.md)
6. [06 - MÃ³dulos e Cobertura Atual](./06-modulos-e-cobertura-atual.md)
7. [07 - DiferenÃ§as para o Legado](./07-diferencas-para-o-legado.md)
8. [08 - Mapa do RepositÃ³rio](./08-mapa-do-repositorio.md)
9. [09 - Bridges app/api](./09-bridges-app-api.md)
10. [10 - EstratÃ©gia de Testes](./10-estrategia-de-testes.md)
11. [11 - Roteiro de ApresentaÃ§Ã£o](./11-roteiro-apresentacao-admin-v2.md)
12. [12 - CatÃ¡logo de Componentes Compartilhados](./12-catalogo-componentes-compartilhados.md)
13. [13 - MÃ³dulo Clientes](./13-modulo-clientes.md)
14. [14 - MÃ³dulo UsuÃ¡rios](./14-modulo-usuarios.md)
15. [15 - MÃ³dulo Administradores](./15-modulo-administradores.md)
16. [16 - MÃ³dulo Vendedores](./16-modulo-vendedores.md)
17. [17 - MÃ³dulo Banners](./17-modulo-banners.md)
18. [18 - MÃ³dulo NotificaÃ§Ãµes App e Avise-me](./18-modulo-notificacoes-app-e-aviseme.md)
19. [19 - MÃ³dulo Cupons Desconto](./19-modulo-cupons-desconto.md)
20. [20 - MÃ³dulo Combos](./20-modulo-combos.md)
21. [21 - MÃ³dulo PromoÃ§Ãµes Estruturadas](./21-modulo-promocoes-estruturadas.md)
22. [22 - MÃ³dulo Pessoas Complementares](./22-modulo-pessoas-complementares.md)
23. [24 - MÃ³dulo LogÃ­stica BÃ¡sica](./24-modulo-logistica-basica.md)
24. [25 - MÃ³dulo Formas de Entrega](./25-modulo-formas-de-entrega.md)
25. [26 - Cadastros Lineares Base](./26-cadastros-lineares-base.md)
26. [27 - MÃ³dulo Limites de CrÃ©dito](./27-modulo-financeiro-credito.md)
27. [28 - MÃ³dulos Financeiros de Pagamento](./28-modulo-financeiro-pagamentos.md)
28. [29 - MÃ³dulo PreÃ§os e Estoques](./29-modulo-precos-estoques.md)
29. [30 - Uploads, Assets e S3](./30-upload-assets-s3.md)
30. [31 - MÃ³dulo Produtos](./31-modulo-produtos.md)
31. [32 - MÃ³dulo Pedidos](./32-modulo-pedidos.md)
32. [33 - MÃ³dulo Ferramentas > Editor SQL](./33-modulo-ferramentas-editor-sql.md)
33. [34 - MÃ³dulo RelatÃ³rios v2](./34-modulo-relatorios-v2.md)
34. [35 - MÃ³dulo ConfiguraÃ§Ãµes > Clientes](./35-modulo-configuracoes-clientes.md)
35. [36 - MÃ³dulo ConfiguraÃ§Ãµes > Entregas](./36-modulo-configuracoes-entregas.md)
36. [37 - MÃ³dulo ConfiguraÃ§Ãµes > Geral](./37-modulo-configuracoes-geral.md)
37. [38 - MÃ³dulo ConfiguraÃ§Ãµes > InÃ­cio](./38-modulo-configuracoes-inicio.md)
38. [39 - Módulo Configurações > Layout](./39-modulo-configuracoes-layout.md)
39. [40 - Módulo Configurações > Pedidos, Preços, Produtos e Vendedores](./40-modulo-configuracoes-pedidos-precos-produtos-vendedores.md)
40. [41 - Módulo Configurações > Assistentes e Parâmetros](./41-modulo-configuracoes-assistentes-e-parametros.md)
41. [42 - Módulo Perfis](./42-modulo-perfis.md)
42. [43 - Módulo Ferramentas > HTTP Client](./43-modulo-ferramentas-http-client.md)
43. [ADRs](./adr/README.md)

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

## Regra prÃ¡tica de atualizaÃ§Ã£o
Sempre que houver mudanÃ§a real de arquitetura, ambiente, fluxo operacional, mÃ³dulo migrado ou componente compartilhado:
- atualizar o documento de mÃ³dulo correspondente;
- revisar [06 - MÃ³dulos e Cobertura Atual](./06-modulos-e-cobertura-atual.md);
- revisar este Ã­ndice se um documento novo entrar em `docs/`.

