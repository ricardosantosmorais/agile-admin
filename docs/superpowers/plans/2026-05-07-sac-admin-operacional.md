# SAC Admin Operacional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar a fatia operacional principal do SAC legado para o Admin v2.

**Architecture:** A tela `/sac` é uma página operacional própria. Bridges em `app/api/sac/*` preservam sessão e tenant e encaminham para a API v3. Mappers tolerantes isolam o contrato legado/API da UI.

**Tech Stack:** Next.js App Router, React, Vitest, Testing Library, bridges `app/api/*`.

---

### Task 1: Contratos e Mappers

**Files:**
- Create: `src/features/sac-admin/types/sac-admin.ts`
- Create: `src/features/sac-admin/services/sac-admin-mappers.ts`
- Test: `src/features/sac-admin/services/sac-admin-mappers.test.ts`

- [x] Escrever teste vermelho para dashboard, listagem, detalhe e status.
- [x] Implementar normalizadores tolerantes para payloads `sac/admin/*`.
- [x] Rodar Vitest focado e confirmar verde.

### Task 2: Bridges

**Files:**
- Create: `app/api/sac/_shared.ts`
- Create: `app/api/sac/dashboard/route.ts`
- Create: `app/api/sac/chamados/route.ts`
- Create: `app/api/sac/chamados/[id]/route.ts`
- Create: `app/api/sac/chamados/[id]/action/route.ts`
- Test: `app/api/sac/route.test.ts`

- [x] Escrever teste vermelho para encaminhamento de dashboard, lista, detalhe, ação e sessão ausente.
- [x] Implementar bridges preservando token e tenant ativo.
- [x] Rodar Vitest focado e confirmar verde.

### Task 3: Tela Operacional

**Files:**
- Create: `src/features/sac-admin/services/sac-admin-client.ts`
- Create: `src/features/sac-admin/components/sac-admin-page.tsx`
- Create: `app/(protected)/sac/page.tsx`
- Test: `src/features/sac-admin/components/sac-admin-page.test.tsx`

- [x] Escrever teste vermelho para dashboard/lista, detalhe e permissão sem resposta.
- [x] Implementar página `/sac` com KPIs, filtros, tabela, modal e resposta.
- [x] Rodar Vitest focado e confirmar verde.

### Task 4: Menu, Permissões e Documentação

**Files:**
- Modify: `src/features/auth/services/permissions.ts`
- Modify: `src/components/navigation/menu-items.ts`
- Modify: `src/i18n/dictionaries/pt-BR.ts`
- Modify: `src/i18n/dictionaries/en-US.ts`
- Create: `docs/51-modulo-sac-admin.md`
- Modify: `_workspace/legacy-parity-2026-03-24/*`

- [x] Mapear `sac-dashboard` e `sac-chamados` para `/sac`.
- [x] Registrar feature `sac` e strings PT/EN.
- [x] Atualizar inventário, docs e deferred.

### Task 5: Validação Final

- [x] Rodar Vitest focado.
- [x] Rodar `typecheck`.
- [x] Rodar `lint`.
- [x] Rodar `git diff --check`.
- [x] Rodar `build`.
- [ ] Commitar e publicar a branch.
