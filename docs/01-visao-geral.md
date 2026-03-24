# 01 - Visão Geral

## O que é o Admin v2
O `admin-v2-web` é a nova interface administrativa da plataforma Agile. Ele substitui gradualmente o admin legado, preservando:
- regras de negócio;
- permissões por funcionalidade;
- contexto multiempresa;
- contratos com a `api-v3`.

O foco do v2 é migrar a operação para uma base frontend moderna, componentizada e com menos acoplamento entre tela, infraestrutura e comportamento global.

## Princípios do projeto
- manter paridade funcional com o legado quando o módulo já foi migrado;
- reaproveitar componentes compartilhados sempre que o fluxo for realmente repetível;
- não forçar abstração genérica em telas operacionais complexas;
- usar bridges locais em `app/api/*` para preservar segurança, sessão e contexto de tenant;
- documentar diferenças arquiteturais em relação ao legado.

## Estrutura macro
- `app/`
  - rotas do App Router;
  - layouts protegidos;
  - endpoints bridge em `app/api/*`.
- `src/components/`
  - shell;
  - componentes de UI;
  - bases de CRUD;
  - componentes de tabela e modal.
- `src/features/`
  - módulos de negócio;
  - clients, mappers, tipos, páginas e componentes locais.
- `src/contexts/`
  - autenticação;
  - tenant;
  - sessão;
  - UI.
- `src/services/`
  - HTTP e integrações transversais.

## Estado atual
O projeto já possui:
- login;
- dashboard;
- shell com menu real;
- i18n PT/EN;
- controle de sessão e expiração;
- múltiplos CRUDs simples e médios;
- módulos operacionais como clientes, vendedores, usuários e administradores parcialmente migrados.

