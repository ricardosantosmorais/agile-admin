# ADRs do Admin v2

## Objetivo
Esta pasta registra as Architectural Decision Records do `admin-v2-web`.

Cada ADR descreve:
- contexto;
- decisão tomada;
- consequências técnicas;
- impacto no projeto.

ADRs não substituem a documentação geral. Eles existem para registrar decisões que moldam a arquitetura e que devem continuar válidas ao longo da evolução do sistema.

## Lista
1. [ADR-001 - Next.js App Router como base do frontend](./ADR-001-nextjs-app-router.md)
2. [ADR-002 - Bridges app/api para integração com a API v3](./ADR-002-bridges-app-api.md)
3. [ADR-003 - Sessão, expiração e multiabas no frontend](./ADR-003-sessao-expiracao-multiabas.md)
4. [ADR-004 - I18n local no frontend, sem dependência de banco](./ADR-004-i18n-local.md)
5. [ADR-005 - Hierarquia de bases compartilhadas para CRUDs e módulos operacionais](./ADR-005-bases-compartilhadas-crud.md)
6. [ADR-006 - Observabilidade centralizada com Sentry no App Router](./ADR-006-observabilidade-sentry.md)
7. [ADR-007 - Estratégia de upload compartilhado com preparação para S3](./ADR-007-upload-compartilhado-s3.md)
8. [ADR-008 - Editor SQL como página operacional com persistência local](./ADR-008-editor-sql-workspace-local.md)

## Quando criar um novo ADR
Criar ou atualizar ADR quando houver:
- decisão arquitetural que afeta mais de um módulo;
- mudança de infraestrutura compartilhada;
- novo padrão que passa a orientar implementações futuras;
- trade-off explícito que a equipe precisará manter ao longo do tempo.
