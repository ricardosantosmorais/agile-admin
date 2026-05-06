# 06 - MÃ³dulos e Cobertura Atual

## Cobertura jÃ¡ migrada

### Base

- Login
- Dashboard
- NotificaÃ§Ãµes

### Cadastros BÃ¡sicos / ManutenÃ§Ã£o

- Funcionalidades
- Componentes
- E-mails Payloads
- Apps
- Categorias de Tarefas
- Tarefas
- Grupos de Relatorios
- Filiais
- Canais de distribuiÃ§Ã£o
- Grupos de filiais
- Fases
- Sequenciais

### ManutenÃ§Ã£o

- Campos de formulÃ¡rios
- Termos de pesquisa
- RestriÃ§Ã£o x Produtos
- ExceÃ§Ãµes x Produtos
- Logs

### Pessoas

- Clientes
- Empresas
- Supervisores
- Contatos
- Grupos de Clientes
- Redes de Clientes
- Segmentos de Clientes
- Regras de Cadastro
- Vendedores
- UsuÃ¡rios
- Administradores
- Perfis

### ConfiguraÃ§Ãµes

- Clientes
- Entregas
- Geral
- InÃ­cio
- Layout
- Assistente virtual
- ParÃ¢metros
- Pedidos
- PreÃ§os
- Produtos
- Vendedores
- Assistente de vendas IA

ObservaÃ§Ã£o:

- `ConfiguraÃ§Ãµes > Clientes` inaugura o padrÃ£o de formulÃ¡rio direto para esse menu, sem tela de listagem intermediÃ¡ria.
- `ConfiguraÃ§Ãµes > Entregas` segue o mesmo padrÃ£o, mas adiciona uma segunda carga para listar as formas de entrega disponÃ­veis.
- `ConfiguraÃ§Ãµes > Geral` segue o mesmo padrÃ£o, mas usa schema dinÃ¢mico de `configuracoes_empresa` para montar os campos.
- `ConfiguraÃ§Ãµes > Pedidos`, `PreÃ§os`, `Produtos` e `Vendedores` seguem o padrÃ£o de formulÃ¡rio direto, com dirty payload e botÃ£o `Salvar` habilitado apenas quando hÃ¡ alteraÃ§Ã£o.
- `ConfiguraÃ§Ãµes > Assistente virtual` segue o padrÃ£o de formulÃ¡rio direto, com upload pÃºblico no bucket do tenant e payload parcial.
- `ConfiguraÃ§Ãµes > ParÃ¢metros` mantÃ©m o fluxo de lista -> formulÃ¡rio e adiciona modal de visualizaÃ§Ã£o com JSON.
- `ConfiguraÃ§Ãµes > Assistente de vendas IA` embute a ferramenta externa no prÃ³prio v2 com JWT server-side.

### CatÃ¡logo / ConteÃºdo

- Produtos
- Linhas
- Cores
- Banners
- Ãreas de Banner
- Ãreas de PÃ¡gina
- E-mails
- PÃ¡ginas
- ColeÃ§Ãµes
- Listas
- Marcas
- Departamentos
- Fornecedores
- Grades
- Produtos x Departamentos

### Marketing

- Combos
- Grupos de Combos
- Leve e Pague
- Compre e Ganhe
- Desconto na Unidade
- Compre Junto
- Cupons Desconto
- NotificaÃ§Ãµes App
- Avise-me

### LogÃ­stica

- Formas de entrega
- Transportadoras
- Portos
- Ãreas de atuaÃ§Ã£o
- PraÃ§as
- Rotas

### Financeiro

- Limites de crÃ©dito
- CondiÃ§Ãµes de pagamento
- Tabelas de preÃ§o
- Formas de pagamento

### PreÃ§os e Estoques

- Tributos
- Tributos x Partilha
- Produtos x Filiais
- Produtos x Tabelas de PreÃ§o
- Produtos x Precificadores

### Pedidos

- Pedidos

### Ferramentas

- Editor SQL
- HTTP Client
- DicionÃ¡rio de Dados

### API de IntegraÃ§Ã£o

- Aplicativos

### Integrações

- Atendimento
- Clientes
- Aplicativos
- Notificações
- Segurança
- Scripts
- Marketing
- Login Social
- Promoções
- Logística
- Financeiro
- Gateways de Pagamento

### RelatÃ³rios

- RelatÃ³rios v2

## ObservaÃ§Ãµes atuais de cobertura

- `Dashboard` carrega fases e grÃ¡ficos sob demanda, mantendo a carga completa apenas na exportaÃ§Ã£o de PDF.
- `Cadastros > Componentes` possui listagem, formulario em abas, upload para CDN publica de componentes, editor JSON e aba de campos com modal, opcoes personalizadas, exclusao e reordenacao.
- `Cadastros > E-mails Payloads` possui CRUD linear v2 com listagem, filtros, formulario em linhas e editor JSON para o payload.
- `Cadastros > Apps` possui listagem v2 com acoes de compilacao, publicacao Android/iOS e logs; formulario em linhas com arquivos privados S3 por empresa; e bridges server-side para sincronizar `config/clients.json` e disparar GitHub Actions sem expor token no client.
- `Notificacoes` do painel possui rota v2 em `/notificacoes-painel`, com listagem server-side, filtros do legado, formulario em abas, vinculo por empresa, pre-visualizacao, duplicacao, publicacao e modal de usuarios visualizadores.
- `Cadastros > Categorias de Tarefas`, `Tarefas` e `Grupos de Relatorios` possuem CRUDs v2 com bridges dedicadas, formularios em linhas e lookups lazy para fases, categorias e empresas quando aplicavel.
- `Cadastros > Relatorios v2` possui rota de cadastro separada da execucao operacional, com dados gerais, editor SQL executavel e mapeamento de campos da query.
- `Filiais` cobre os complementos do legado para filial selecionavel, tabela de preco, variacao, distancia maxima e UFs de excecao/restricao, com normalizacao antes de salvar.
- `Grupos de filiais` cobre os lookups complementares de filial NF e tabela de preco, alem da filial padrao.
- `ConfiguraÃ§Ãµes > Clientes` lÃª e grava parÃ¢metros do tenant direto em `empresas/parametros`, seguindo o contrato do legado.
- `ConfiguraÃ§Ãµes > Entregas` usa o mesmo contrato de parÃ¢metros e complementa o carregamento com `formas_entrega` para o campo padrÃ£o.
- `ConfiguraÃ§Ãµes > Geral` combina `empresas/parametros`, `configuracoes_empresa` e atualizaÃ§Ã£o parcial de `empresas` para os campos estruturais do tenant.
- `ConfiguraÃ§Ãµes > InÃ­cio` usa `empresas/parametros` com lookups auxiliares de filial, pagamento, prazo e tabela de preÃ§o para compor o contexto inicial da loja.
- `ConfiguraÃ§Ãµes > PreÃ§os` complementa `empresas/parametros` com lookups de formas de pagamento, condiÃ§Ãµes e tabelas de preÃ§o.
- `ConfiguraÃ§Ãµes > Vendedores` acrescenta uma seÃ§Ã£o de disponibilidade semanal baseada nos mesmos parÃ¢metros do legado.
- `ConfiguraÃ§Ãµes > Assistente virtual` grava em `empresas/parametros` e usa upload pÃºblico em `imgs/` para o avatar.
- `ConfiguraÃ§Ãµes > ParÃ¢metros` usa `parametros_cadastro_lista` na listagem e `parametro_cadastro` para detalhe/gravaÃ§Ã£o.
- `ConfiguraÃ§Ãµes > Assistente de vendas IA` depende das variÃ¡veis `ASSISTENTE_VENDAS_IA_URL` e `ASSISTENTE_VENDAS_IA_JWT_SECRET`.
- `Produtos` jÃ¡ possui listagem, formulÃ¡rio principal e abas relacionais de ediÃ§Ã£o no v2:
  - `Filiais`
  - `Embalagens`
  - `Relacionados`
  - `Imagens`
  - seleÃ§Ã£o dinÃ¢mica de `Grades e cores`
- `Pedidos` jÃ¡ cobre:
  - listagem server-side;
  - filtros principais do legado;
  - detalhe operacional;
  - aÃ§Ãµes de aprovar pagamento e cancelar pedido com motivo;
  - atualizaÃ§Ã£o de observaÃ§Ãµes internas e entrega;
  - timeline e logs no detalhe.
- `PreÃ§os e Estoques` combina CRUDs lineares com:
  - `PrecificaÃ§Ã£o rÃ¡pida` para `Produtos x Tabelas de PreÃ§o`;
  - wizard prÃ³prio para `Produtos x Precificadores`.
- `Ferramentas > Editor SQL` jÃ¡ possui:
  - Monaco;
  - mÃºltiplas abas;
  - fullscreen;
  - resultado em tabela ou JSON;
  - exportaÃ§Ã£o e cÃ³pia;
  - restore local do workspace por usuÃ¡rio e tenant no navegador.
- `Ferramentas > HTTP Client` jÃ¡ possui:
  - abas de requisiÃ§Ã£o;
  - endpoint por catÃ¡logo da API ou URL custom;
  - autenticaÃ§Ã£o plataforma, bearer, basic ou sem auth;
  - params, headers e body por requisiÃ§Ã£o;
  - execuÃ§Ã£o server-side com resposta completa (status, tempo, headers e body);
  - catÃ¡logo de requisiÃ§Ãµes salvas no mesmo backend do legado.
- `Ferramentas > DicionÃ¡rio de Dados` jÃ¡ possui:
  - Ã¡rvore de tabelas com busca por tabela e campo;
  - visualizaÃ§Ã£o de componentes por tabela;
  - status dos campos por componente (`Encontrado`, `Ignorado`, `NÃ£o disponÃ­vel`);
  - aÃ§Ãµes para ignorar/remover status e editar descriÃ§Ã£o/regra de tabela e campo;
  - exportaÃ§Ã£o HTML consolidada via bridge no App Router.
- `API de IntegraÃ§Ã£o > Aplicativos` jÃ¡ possui:
  - listagem server-side com filtros de `id`, `cÃ³digo`, `nome`, `email` e `ativo`;
  - criaÃ§Ã£o e ediÃ§Ã£o de aplicativo com contrato do legado (`gestao_usuario`);
  - aÃ§Ãµes para copiar `Client ID`, copiar `Secret` e gerar novo `Secret`;
  - rota dedicada para permissÃµes de acesso por aplicativo, no lugar do modal legado.
- `Integrações` já possui:
  - páginas diretas para `Atendimento`, `Clientes`, `Aplicativos`, `Notificações`, `Segurança`, `Scripts`, `Marketing`, `Login Social`, `Promoções`, `Logística` e `Financeiro`;
  - `Integração com ERP` alinhada ao menu root atual do legado, com os três blocos principais: `Cadastros`, `Dashboard ERP` e `Serviços com Falha`;
  - `Cadastros` já possui página-hub própria no v2 em `/integracao-com-erp/cadastros`, servindo como ponto de entrada da migração dos cadastros ERP ainda mantidos no legado;
  - `Cadastros > ERPs` agora já possui CRUD próprio no v2 em `/integracao-com-erp/cadastros/erps`, com listagem server-side, formulário linear e bridge root-only fiel ao contrato do legado;
  - `Cadastros > Templates` agora já possui CRUD próprio no v2 em `/integracao-com-erp/cadastros/templates`, com vínculo ao cadastro de `ERPs`, listagem server-side e bridge root-only fiel ao contrato do legado;
  - `Cadastros > Parâmetros Grupo` agora já possui CRUD próprio no v2 em `/integracao-com-erp/cadastros/parametros-grupo`, com listagem server-side, formulário linear e bridge root-only fiel ao contrato do legado;
  - `Cadastros > Parâmetros Cadastro` agora já possui CRUD próprio no v2 em `/integracao-com-erp/cadastros/parametros-cadastro`, com lookups lazy para `Parâmetros Grupo` e `Templates`, regras condicionais por `tipo_entrada` e bridge root-only fiel ao contrato do legado;
  - `Cadastros > Queries` agora já possui módulo próprio no v2 em `/integracao-com-erp/cadastros/queries`, com listagem server-side, formulário em abas, editor SQL Monaco, execução contra integradores ativos e aba de mapeamento em edição;
  - `Cadastros > Scripts` agora já possui módulo próprio no v2 em `/integracao-com-erp/cadastros/scripts`, com listagem server-side e formulário direto com editor Monaco cuja linguagem acompanha o select do legado;
  - `Cadastros > Endpoints` agora já possui módulo próprio no v2 em `/integracao-com-erp/cadastros/endpoints`, com listagem server-side, campos condicionais por `tipo_retorno` e aba de perfis em edição;
  - `Cadastros > Serviços` mantém paridade do modo `dataset_consolidado` do legado, exibindo campos de mapeamento consolidado apenas para `endpoint_gateway`, limpando payload obsoleto fora desse modo e preservando o modal operacional de log com copiar conteúdo e download;
  - páginas diretas já disponíveis no v2 para `Parâmetros`, `Imagens`, `API`, `Banco de Dados`, `Instalação do Integrador`, `Dashboard ERP`, `Rotinas Integradas`, `Serviços` e `Serviços com Falha`;
  - bridges dedicadas em `app/api/integracoes/*` para todos os módulos do menu;
  - bridge dedicada em `app/api/integracao-com-erp/*` para configuração e leitura operacional do dashboard ERP;
  - `Gateways de Pagamento` com listagem, formulário novo, edição por id e regras condicionais do legado reaproveitadas no CRUD do v2;
  - cobertura E2E do fluxo principal para `Atendimento`, `Clientes`, `Login Social`, `Logística`, `Marketing`, `Notificações`, `Promoções`, `Scripts`, `Segurança`, `Financeiro` e `Gateways de Pagamento`.
- `Menu do cliente` agora já possui no v2:
  - `Meus atendimentos` com listagem server-side, filtros por protocolo, status e período, detalhe do atendimento em modal e subpágina de `Vínculo Intercom`;
  - `Base de conhecimento` com listagem server-side de artigos do Intercom, filtro textual e leitura do HTML no overlay do shell;
  - `Atualizações gerais` dos tenants seguem como timeline pública em `/atualizacoes-gerais`.
  - `Changelog` administrativo do root `agileecommerce` agora é um módulo próprio, separado, em `/changelog`.
- `ManutenÃ§Ã£o > Termos de pesquisa` jÃ¡ possui:
  - listagem server-side com filtros por `id`, `termos`, `resultado` e `ativo`;
  - criaÃ§Ã£o e ediÃ§Ã£o com os campos `ativo`, `termos` e `resultado`;
  - bridge dedicada via `app/api/termos-pesquisa` sem fallback para `/legacy/...`.
- `ManutenÃ§Ã£o > Campos de formulÃ¡rios` jÃ¡ possui:
  - listagem server-side com filtros por `id`, `id_formulario`, `codigo`, `titulo`, `tipo`, `protegido` e `ativo`;
  - criaÃ§Ã£o e ediÃ§Ã£o com reaproveitamento da base CRUD, incluindo serializaÃ§Ã£o para campos opcionais e dependentes do tipo do campo;
  - bridges dedicadas via `app/api/formularios-campos` e `app/api/formularios`, sem fallback para `/legacy/...`;
  - invalidação segmentada de cache após gravação, exclusão e reordenação bem-sucedidas, alinhada aos serviços `Formulario` e `FormularioCampo` do legado.
- `Consultas > Envios de Formulários` já possui:
  - listagem e detalhe com resolução de pessoa por `cliente` ou `contato`, seguindo a prioridade de nome e documento do legado;
  - filtro de cliente expandido para pesquisar também contatos;
  - exportação com `data_envio`, `cnpj_cpf`, `nome_fantasia` e valores enviados por campo.
- `ManutenÃ§Ã£o > Logs` jÃ¡ possui:
  - listagem server-side com filtros por `id_registro`, `mÃ³dulo`, `usuÃ¡rio`, perÃ­odo e `aÃ§Ã£o`;
  - modal de detalhe por registro com dados do evento e snapshots JSON anterior/novo;
  - bridge dedicada via `app/api/logs` sem fallback para `/legacy/...`.
- `ManutenÃ§Ã£o > Processamento de Imagens` jÃ¡ possui:
  - listagem server-side com filtros por `id`, `usuÃ¡rio`, perÃ­odo e `status`;
  - upload de arquivo ZIP para criaÃ§Ã£o de processo do tipo `imagens`;
  - aÃ§Ãµes de cancelar/reprocessar processo e modal de detalhe com logs;
  - bridges dedicadas via `app/api/processos-imagens` sem fallback para `/legacy/...`.
- `ManutenÃ§Ã£o > Templates de E-mails` jÃ¡ possui:
  - listagem server-side com filtros por `id`, `cÃ³digo`, `tÃ­tulo` e `ativo`;
  - formulÃ¡rio em abas com `Dados gerais` e `Editor`;
  - editor avanÃ§ado HTML/Twig/PHP com:
    - conversÃ£o entre modelos;
    - painel de variÃ¡veis por tipo (`emails_payloads`) com inserÃ§Ã£o por clique/drag;
    - histÃ³rico de versÃµes (`emails_templates_historico`) com recarga de conteÃºdo no editor;
    - prÃ©-visualizaÃ§Ã£o (`emails_templates/preview`) com fallback local simplificado;
  - normalizaÃ§Ã£o de payload de escrita para booleans e campos opcionais;
  - bridges dedicadas via `app/api/emails-templates` (CRUD + `payload` + `preview`) sem fallback para `/legacy/...`.
- `ManutenÃ§Ã£o > Importar Planilha` jÃ¡ possui:
  - listagem server-side com filtros por `id`, `usuÃ¡rio`, perÃ­odo e `status`;
  - upload de arquivo XLS/XLSX com suporte a arquivos grandes via multipart/chunks;
  - aÃ§Ãµes de iniciar, cancelar e reprocessar processo, com modal de detalhe e logs;
  - bridges dedicadas via `app/api/processos-arquivos` sem fallback para `/legacy/...`.
  - subfluxo de mapeamento de colunas permanece como prÃ³ximo incremento da mesma feature.
- `ManutenÃ§Ã£o > RestriÃ§Ã£o x Produtos` jÃ¡ possui:
  - listagem server-side com filtros por busca geral, `perfil` e `ativo`;
  - detalhe expansÃ­vel por registro para visualizaÃ§Ã£o rÃ¡pida de alvo e produtos afetados;
  - wizard prÃ³prio inspirado em `Produtos x Precificadores`, com etapas para pÃºblico-alvo, produtos, regra, condiÃ§Ãµes e revisÃ£o;
  - gravaÃ§Ã£o em lote pela bridge com manutenÃ§Ã£o de `id_pai` e exclusÃ£o de dependentes removidos;
  - bridges dedicadas via `app/api/restricoes-produtos` sem fallback para `/legacy/...`.

- `ManutenÃ§Ã£o > ExceÃ§Ãµes x Produtos` jÃ¡ possui:
  - listagem server-side com filtros por busca geral e `ativo`;
  - detalhe expansÃ­vel por registro para visualizaÃ§Ã£o rÃ¡pida de alvo, produtos e perÃ­odo de pai + filhos;
  - wizard prÃ³prio inspirado em `Produtos x Precificadores`, com etapas para pÃºblico-alvo, produtos, regra, condiÃ§Ãµes e revisÃ£o;
  - gravaÃ§Ã£o em lote pela bridge com manutenÃ§Ã£o de `id_pai` e exclusÃ£o de dependentes removidos;
  - bridges dedicadas via `app/api/excecoes-produtos` sem fallback para `/legacy/...`.

- `ConteÃƒÂºdo > Arquivos` jÃƒÂ¡ possui:
  - listagem server-side com filtros por `id`, `arquivo` e perÃƒÂ­odo de envio;
  - upload para o bucket pÃƒÂºblico do tenant em `arquivos/`, com pasta opcional, via modal no padrÃƒÂ£o do v2;
  - exclusÃƒÂ£o em lote e abertura direta do arquivo, respeitando preview para formatos compatÃƒÂ­veis;
  - bridge dedicada via `app/api/arquivos` sem fallback para `/legacy/...`.

## Estado arquitetural da cobertura

### CRUDs simples

Usam majoritariamente:

- `CrudListPage`
- `CrudFormPage`

### FormulÃ¡rios hÃ­bridos

Usam:

- `CrudFormSections`
- componentes relacionais locais
- formulÃ¡rios tabulados

Casos tÃ­picos:

- grupos de clientes
- regras de cadastro
- catÃ¡logo com abas
- produtos

### FormulÃ¡rios diretos de parÃ¢metros

Usam pÃ¡gina prÃ³pria de ediÃ§Ã£o, sem listagem, quando o legado trabalha diretamente com parÃ¢metros do tenant.

Caso atual:

- `ConfiguraÃ§Ãµes > Clientes`
- `ConfiguraÃ§Ãµes > Entregas`
- `ConfiguraÃ§Ãµes > Geral`
- `ConfiguraÃ§Ãµes > Pedidos`
- `ConfiguraÃ§Ãµes > PreÃ§os`
- `ConfiguraÃ§Ãµes > Produtos`
- `ConfiguraÃ§Ãµes > Vendedores`
- `ConfiguraÃ§Ãµes > Assistente virtual`

### Telas operacionais

Continuam como pÃ¡ginas prÃ³prias, com mais regra de negÃ³cio:

- clientes
- contatos
- vendedores
- usuÃ¡rios
- formas de entrega
- produtos x tabelas de preÃ§o
- produtos x precificadores
- restriÃ§Ã£o x produtos
- pedidos
- editor SQL
- relatÃ³rios v2
- assistente de vendas IA

## O que ainda nÃ£o estÃ¡ fechado

- E2E dedicado para `Assistente virtual`, `ParÃ¢metros` e `Assistente de vendas IA`;
- refinamentos complementares de `Produtos`, caso surjam regras avanÃ§adas adicionais de `Grades` no QA funcional;
- Ã¡reas ainda mapeadas para `/legacy/...`;
- integraÃ§Ã£o completa de upload com backend/S3 em todos os mÃ³dulos elegÃ­veis;
- melhorias futuras de ergonomia do Editor SQL puramente no frontend, como formataÃ§Ã£o manual e aÃ§Ãµes por seleÃ§Ã£o.

## RegressÃµes cobertas nesta fase

- `Topbar` com teste unitÃ¡rio para identificaÃ§Ã£o do tenant master e carregamento do painel de notificaÃ§Ãµes.
- `Pedidos` com teste unitÃ¡rio das aÃ§Ãµes operacionais e E2E cobrindo listagem, detalhe e abertura de todas as abas principais.
- `ConfiguraÃ§Ãµes` com teste de integraÃ§Ã£o validando o estado disabled/enabled do botÃ£o `Salvar` conforme o dirty state.
- `Configurações > Vendedores` com teste unitário para payload da Área Representante V2 e teste da bridge de `Vendedores` cobrindo bloqueio por cotas indisponíveis.
- `Templates de E-mails` com teste de componente cobrindo a aba `Editor`, o carregamento de variÃ¡veis e a abertura da prÃ©-visualizaÃ§Ã£o.
- `Clientes` com testes do controller da listagem e do modal de usuÃ¡rios vinculados.
- `Cadastros ERP > Gateways`, `Gateway Endpoints`, `Interfaces de Consulta`, `Acoes` e `Servicos` com testes unitarios de mapeadores, payloads e filtros usados pelas bridges v2.
