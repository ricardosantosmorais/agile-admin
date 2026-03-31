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

Observações atuais de cobertura:
- `Dashboard` passou a carregar fases e gráficos sob demanda, conforme a seção entra no viewport, mantendo a carga completa apenas na exportação de PDF.
- `Leve e Pague` já aceita vínculo manual por ID/código e também por autocomplete, mantendo persistência por `id_produto`.
- `Compre e Ganhe` já cobre grupo promocional amigável no formulário, labels traduzidas nas grades relacionais e embalagem dinâmica por produto nas abas de regras e produtos.
- `Preços e Estoques` agora combina CRUDs lineares com uma tela operacional de `Precificação rápida` para `Produtos x Tabelas de Preço` e um wizard próprio para `Produtos x Precificadores`.
- `Produtos` já possui listagem, formulário principal e abas relacionais de edição no v2 (`Filiais`, `Embalagens`, `Relacionados`, `Imagens` e seleção dinâmica de `Grades e cores`).
- `Pedidos` já cobre listagem server-side, filtros principais do legado, detalhe operacional e ações de aprovar pagamento / cancelar pedido com motivo.

## Estado arquitetural da cobertura

### CRUDs simples
Usam majoritariamente:
- `CrudListPage`
- `CrudFormPage`

### Formulários híbridos
Usam:
- `CrudFormSections`
- componentes relacionais locais

Casos:
- grupos de clientes
- regras de cadastro
- catálogo com abas

### Telas operacionais
Continuam como páginas próprias, com mais regra de negócio:
- clientes
- contatos
- vendedores
- usuários
- formas de entrega
- produtos x tabelas de preço
- produtos x precificadores

## O que ainda não está fechado
- refinamentos complementares de `Produtos`, caso surjam regras avançadas adicionais de `Grades` no QA funcional;
- módulos administrativos com payload relacional ou árvore, como `Perfis`;
- áreas ainda mapeadas para `/legacy/...`;
- cobertura E2E autenticada ainda precisa de uma harness compartilhada mais estável no ambiente local;
- integração completa de upload com backend/S3 em todos os módulos elegíveis.
### Pedidos
- Pedidos

