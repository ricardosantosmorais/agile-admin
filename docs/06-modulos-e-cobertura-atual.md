# 06 - Módulos e Cobertura Atual

## Cobertura já migrada

### Base
- Login
- Dashboard
- Notificações

### Cadastros Básicos / Manutenção
- Filiais
- Canais de distribuição
- Grupos de filiais
- Fases
- Sequenciais

### Manutenção
- Campos de formulários
- Termos de pesquisa
- Restrição x Produtos
- Exceções x Produtos
- Logs

### Pessoas
- Clientes
- Supervisores
- Contatos
- Grupos de Clientes
- Redes de Clientes
- Segmentos de Clientes
- Regras de Cadastro
- Vendedores
- Usuários
- Administradores
- Perfis

### Configurações
- Clientes
- Entregas
- Geral
- Início
- Layout
- Assistente virtual
- Parâmetros
- Pedidos
- Preços
- Produtos
- Vendedores
- Assistente de vendas IA

Observação:
- `Configurações > Clientes` inaugura o padrão de formulário direto para esse menu, sem tela de listagem intermediária.
- `Configurações > Entregas` segue o mesmo padrão, mas adiciona uma segunda carga para listar as formas de entrega disponíveis.
- `Configurações > Geral` segue o mesmo padrão, mas usa schema dinâmico de `configuracoes_empresa` para montar os campos.
- `Configurações > Pedidos`, `Preços`, `Produtos` e `Vendedores` seguem o padrão de formulário direto, com dirty payload e botão `Salvar` habilitado apenas quando há alteração.
- `Configurações > Assistente virtual` segue o padrão de formulário direto, com upload público no bucket do tenant e payload parcial.
- `Configurações > Parâmetros` mantém o fluxo de lista -> formulário e adiciona modal de visualização com JSON.
- `Configurações > Assistente de vendas IA` embute a ferramenta externa no próprio v2 com JWT server-side.

### Catálogo / Conteúdo
- Produtos
- Linhas
- Cores
- Banners
- Áreas de Banner
- Áreas de Página
- E-mails
- Páginas
- Coleções
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
- Notificações App
- Avise-me

### Logística
- Formas de entrega
- Transportadoras
- Portos
- Áreas de atuação
- Praças
- Rotas

### Financeiro
- Limites de crédito
- Condições de pagamento
- Tabelas de preço
- Formas de pagamento

### Preços e Estoques
- Tributos
- Tributos x Partilha
- Produtos x Filiais
- Produtos x Tabelas de Preço
- Produtos x Precificadores

### Pedidos
- Pedidos

### Ferramentas
- Editor SQL
- HTTP Client
- Dicionário de Dados

### API de Integração
- Aplicativos

### Relatórios
- Relatórios v2

## Observações atuais de cobertura
- `Dashboard` carrega fases e gráficos sob demanda, mantendo a carga completa apenas na exportação de PDF.
- `Configurações > Clientes` lê e grava parâmetros do tenant direto em `empresas/parametros`, seguindo o contrato do legado.
- `Configurações > Entregas` usa o mesmo contrato de parâmetros e complementa o carregamento com `formas_entrega` para o campo padrão.
- `Configurações > Geral` combina `empresas/parametros`, `configuracoes_empresa` e atualização parcial de `empresas` para os campos estruturais do tenant.
- `Configurações > Início` usa `empresas/parametros` com lookups auxiliares de filial, pagamento, prazo e tabela de preço para compor o contexto inicial da loja.
- `Configurações > Preços` complementa `empresas/parametros` com lookups de formas de pagamento, condições e tabelas de preço.
- `Configurações > Vendedores` acrescenta uma seção de disponibilidade semanal baseada nos mesmos parâmetros do legado.
- `Configurações > Assistente virtual` grava em `empresas/parametros` e usa upload público em `imgs/` para o avatar.
- `Configurações > Parâmetros` usa `parametros_cadastro_lista` na listagem e `parametro_cadastro` para detalhe/gravação.
- `Configurações > Assistente de vendas IA` depende das variáveis `ASSISTENTE_VENDAS_IA_URL` e `ASSISTENTE_VENDAS_IA_JWT_SECRET`.
- `Produtos` já possui listagem, formulário principal e abas relacionais de edição no v2:
  - `Filiais`
  - `Embalagens`
  - `Relacionados`
  - `Imagens`
  - seleção dinâmica de `Grades e cores`
- `Pedidos` já cobre:
  - listagem server-side;
  - filtros principais do legado;
  - detalhe operacional;
  - ações de aprovar pagamento e cancelar pedido com motivo;
  - atualização de observações internas e entrega;
  - timeline e logs no detalhe.
- `Preços e Estoques` combina CRUDs lineares com:
  - `Precificação rápida` para `Produtos x Tabelas de Preço`;
  - wizard próprio para `Produtos x Precificadores`.
- `Ferramentas > Editor SQL` já possui:
  - Monaco;
  - múltiplas abas;
  - fullscreen;
  - resultado em tabela ou JSON;
  - exportação e cópia;
  - restore local do workspace por usuário e tenant no navegador.
- `Ferramentas > HTTP Client` já possui:
  - abas de requisição;
  - endpoint por catálogo da API ou URL custom;
  - autenticação plataforma, bearer, basic ou sem auth;
  - params, headers e body por requisição;
  - execução server-side com resposta completa (status, tempo, headers e body);
  - catálogo de requisições salvas no mesmo backend do legado.
- `Ferramentas > Dicionário de Dados` já possui:
  - árvore de tabelas com busca por tabela e campo;
  - visualização de componentes por tabela;
  - status dos campos por componente (`Encontrado`, `Ignorado`, `Não disponível`);
  - ações para ignorar/remover status e editar descrição/regra de tabela e campo;
  - exportação HTML consolidada via bridge no App Router.
- `API de Integração > Aplicativos` já possui:
  - listagem server-side com filtros de `id`, `código`, `nome`, `email` e `ativo`;
  - criação e edição de aplicativo com contrato do legado (`gestao_usuario`);
  - ações para copiar `Client ID`, copiar `Secret` e gerar novo `Secret`;
  - rota dedicada para permissões de acesso por aplicativo, no lugar do modal legado.
- `Manutenção > Termos de pesquisa` já possui:
  - listagem server-side com filtros por `id`, `termos`, `resultado` e `ativo`;
  - criação e edição com os campos `ativo`, `termos` e `resultado`;
  - bridge dedicada via `app/api/termos-pesquisa` sem fallback para `/legacy/...`.
- `Manutenção > Campos de formulários` já possui:
  - listagem server-side com filtros por `id`, `id_formulario`, `codigo`, `titulo`, `tipo`, `protegido` e `ativo`;
  - criação e edição com reaproveitamento da base CRUD, incluindo serialização para campos opcionais e dependentes do tipo do campo;
  - bridges dedicadas via `app/api/formularios-campos` e `app/api/formularios`, sem fallback para `/legacy/...`.
- `Manutenção > Logs` já possui:
  - listagem server-side com filtros por `id_registro`, `módulo`, `usuário`, período e `ação`;
  - modal de detalhe por registro com dados do evento e snapshots JSON anterior/novo;
  - bridge dedicada via `app/api/logs` sem fallback para `/legacy/...`.
- `Manutenção > Processamento de Imagens` já possui:
  - listagem server-side com filtros por `id`, `usuário`, período e `status`;
  - upload de arquivo ZIP para criação de processo do tipo `imagens`;
  - ações de cancelar/reprocessar processo e modal de detalhe com logs;
  - bridges dedicadas via `app/api/processos-imagens` sem fallback para `/legacy/...`.
- `Manutenção > Templates de E-mails` já possui:
  - listagem server-side com filtros por `id`, `código`, `título` e `ativo`;
  - formulário em abas com `Dados gerais` e `Editor`;
  - editor avançado HTML/Twig/PHP com:
    - conversão entre modelos;
    - painel de variáveis por tipo (`emails_payloads`) com inserção por clique/drag;
    - histórico de versões (`emails_templates_historico`) com recarga de conteúdo no editor;
    - pré-visualização (`emails_templates/preview`) com fallback local simplificado;
  - normalização de payload de escrita para booleans e campos opcionais;
  - bridges dedicadas via `app/api/emails-templates` (CRUD + `payload` + `preview`) sem fallback para `/legacy/...`.
- `Manutenção > Importar Planilha` já possui:
  - listagem server-side com filtros por `id`, `usuário`, período e `status`;
  - upload de arquivo XLS/XLSX com suporte a arquivos grandes via multipart/chunks;
  - ações de iniciar, cancelar e reprocessar processo, com modal de detalhe e logs;
  - bridges dedicadas via `app/api/processos-arquivos` sem fallback para `/legacy/...`.
  - subfluxo de mapeamento de colunas permanece como próximo incremento da mesma feature.
- `Manutenção > Restrição x Produtos` já possui:
  - listagem server-side com filtros por busca geral, `perfil` e `ativo`;
  - detalhe expansível por registro para visualização rápida de alvo e produtos afetados;
  - wizard próprio inspirado em `Produtos x Precificadores`, com etapas para público-alvo, produtos, regra, condições e revisão;
  - gravação em lote pela bridge com manutenção de `id_pai` e exclusão de dependentes removidos;
  - bridges dedicadas via `app/api/restricoes-produtos` sem fallback para `/legacy/...`.

- `Manutenção > Exceções x Produtos` já possui:
  - listagem server-side com filtros por busca geral e `ativo`;
  - detalhe expansível por registro para visualização rápida de alvo, produtos e período de pai + filhos;
  - wizard próprio inspirado em `Produtos x Precificadores`, com etapas para público-alvo, produtos, regra, condições e revisão;
  - gravação em lote pela bridge com manutenção de `id_pai` e exclusão de dependentes removidos;
  - bridges dedicadas via `app/api/excecoes-produtos` sem fallback para `/legacy/...`.

## Estado arquitetural da cobertura

### CRUDs simples
Usam majoritariamente:
- `CrudListPage`
- `CrudFormPage`

### Formulários híbridos
Usam:
- `CrudFormSections`
- componentes relacionais locais
- formulários tabulados

Casos típicos:
- grupos de clientes
- regras de cadastro
- catálogo com abas
- produtos

### Formulários diretos de parâmetros
Usam página própria de edição, sem listagem, quando o legado trabalha diretamente com parâmetros do tenant.

Caso atual:
- `Configurações > Clientes`
- `Configurações > Entregas`
- `Configurações > Geral`
- `Configurações > Pedidos`
- `Configurações > Preços`
- `Configurações > Produtos`
- `Configurações > Vendedores`
- `Configurações > Assistente virtual`

### Telas operacionais
Continuam como páginas próprias, com mais regra de negócio:
- clientes
- contatos
- vendedores
- usuários
- formas de entrega
- produtos x tabelas de preço
- produtos x precificadores
- restrição x produtos
- pedidos
- editor SQL
- relatórios v2
- assistente de vendas IA

## O que ainda não está fechado
- E2E dedicado para `Assistente virtual`, `Parâmetros` e `Assistente de vendas IA`;
- refinamentos complementares de `Produtos`, caso surjam regras avançadas adicionais de `Grades` no QA funcional;
- áreas ainda mapeadas para `/legacy/...`;
- integração completa de upload com backend/S3 em todos os módulos elegíveis;
- melhorias futuras de ergonomia do Editor SQL puramente no frontend, como formatação manual e ações por seleção.
