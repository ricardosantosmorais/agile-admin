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

## Observações atuais de cobertura
- `Dashboard` carrega fases e gráficos sob demanda, mantendo a carga completa apenas na exportação de PDF.
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

## O que ainda não está fechado
- refinamentos complementares de `Produtos`, caso surjam regras avançadas adicionais de `Grades` no QA funcional;
- módulos administrativos com payload relacional ou árvore, como `Perfis`;
- áreas ainda mapeadas para `/legacy/...`;
- integração completa de upload com backend/S3 em todos os módulos elegíveis;
- melhorias futuras de ergonomia do Editor SQL puramente no frontend, como formatação manual e ações por seleção.
