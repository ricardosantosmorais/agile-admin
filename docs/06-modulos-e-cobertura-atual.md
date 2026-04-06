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
