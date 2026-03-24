# 06 - Módulos e Cobertura Atual

## Cobertura já migrada

### Base
- Login
- Dashboard
- Notificações

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
- Transportadoras
- Portos
- Áreas de atuação
- Praças
- Rotas

Observações atuais de cobertura:
- `Leve e Pague` já aceita vínculo manual por ID/código e também por autocomplete, mantendo persistência por `id_produto`.
- `Compre e Ganhe` já cobre grupo promocional amigável no formulário, labels traduzidas nas grades relacionais e embalagem dinâmica por produto nas abas de regras e produtos.

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

## O que ainda não está fechado
- módulos mais complexos como produtos;
- `Formas de entrega` em logística;
- áreas ainda mapeadas para `/legacy/...`;
- cobertura E2E autenticada ainda precisa de uma harness compartilhada;
- integração completa de upload com backend/S3.
