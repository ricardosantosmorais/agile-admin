# 06 - MÃ³dulos e Cobertura Atual

## Cobertura jÃ¡ migrada

### Base
- Login
- Dashboard
- NotificaÃ§Ãµes

### Cadastros BÃ¡sicos / ManutenÃ§Ã£o
- Filiais
- Canais de distribuiÃ§Ã£o
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
- UsuÃ¡rios
- Administradores

### CatÃ¡logo / ConteÃºdo
- Produtos
- Linhas
- Cores
- Banners
- Ãreas de Banner
- Ãreas de PÃ¡gina
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
- Ãreas de atuaÃ§Ã£o
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

ObservaÃ§Ãµes atuais de cobertura:
- `Dashboard` passou a carregar fases e grÃ¡ficos sob demanda, conforme a seÃ§Ã£o entra no viewport, mantendo a carga completa apenas na exportaÃ§Ã£o de PDF.
- `Leve e Pague` jÃ¡ aceita vÃ­nculo manual por ID/cÃ³digo e tambÃ©m por autocomplete, mantendo persistÃªncia por `id_produto`.
- `Compre e Ganhe` jÃ¡ cobre grupo promocional amigÃ¡vel no formulÃ¡rio, labels traduzidas nas grades relacionais e embalagem dinÃ¢mica por produto nas abas de regras e produtos.
- `PreÃ§os e Estoques` agora combina CRUDs lineares com uma tela operacional de `PrecificaÃ§Ã£o rÃ¡pida` para `Produtos x Tabelas de PreÃ§o` e um wizard prÃ³prio para `Produtos x Precificadores`.
- `Produtos` jÃ¡ possui listagem, formulÃ¡rio principal e abas relacionais de ediÃ§Ã£o no v2 (`Filiais`, `Embalagens`, `Relacionados`, `Imagens` e seleÃ§Ã£o dinÃ¢mica de `Grades e cores`).
- `Pedidos` jÃ¡ cobre listagem server-side, filtros principais do legado, detalhe operacional e aÃ§Ãµes de aprovar pagamento / cancelar pedido com motivo.

## Estado arquitetural da cobertura

### CRUDs simples
Usam majoritariamente:
- `CrudListPage`
- `CrudFormPage`

### FormulÃ¡rios hÃ­bridos
Usam:
- `CrudFormSections`
- componentes relacionais locais

Casos:
- grupos de clientes
- regras de cadastro
- catÃ¡logo com abas

### Telas operacionais
Continuam como pÃ¡ginas prÃ³prias, com mais regra de negÃ³cio:
- clientes
- contatos
- vendedores
- usuÃ¡rios
- formas de entrega
- produtos x tabelas de preÃ§o
- produtos x precificadores

## O que ainda nÃ£o estÃ¡ fechado
- refinamentos complementares de `Produtos`, caso surjam regras avanÃ§adas adicionais de `Grades` no QA funcional;
- mÃ³dulos administrativos com payload relacional ou Ã¡rvore, como `Perfis`;
- Ã¡reas ainda mapeadas para `/legacy/...`;
- cobertura E2E autenticada ainda precisa de uma harness compartilhada mais estável no ambiente local;
- integração completa de upload com backend/S3 em todos os módulos elegíveis.
### Pedidos
- Pedidos

