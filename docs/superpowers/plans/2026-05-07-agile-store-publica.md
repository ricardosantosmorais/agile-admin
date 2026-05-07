# Agile Store Publica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public Agile Store v2 surface with list, detail and module actions backed by API v3 bridges.

**Architecture:** Add a dedicated `agile-store` feature instead of forcing the catalog into CRUD bases. Route handlers in `app/api/agile-store/*` proxy the API v3 contract, while client-side pages consume typed mappers and render a v2-native operational storefront.

**Tech Stack:** Next.js App Router, React, TypeScript, local `httpClient`, `serverApiFetch`, Vitest and Testing Library.

---

### Task 1: Contracts and mappers

**Files:**
- Create: `src/features/agile-store/types/agile-store.ts`
- Create: `src/features/agile-store/services/agile-store-mappers.ts`
- Test: `src/features/agile-store/services/agile-store-mappers.test.ts`

- [ ] Write failing tests for list normalization, status labels and action availability.
- [ ] Run `.\npxw.cmd vitest run src\features\agile-store\services\agile-store-mappers.test.ts` and confirm failures.
- [ ] Implement minimal types and mappers.
- [ ] Rerun the mapper tests until green.

### Task 2: API bridges and client

**Files:**
- Create: `app/api/agile-store/route.ts`
- Create: `app/api/agile-store/[id]/route.ts`
- Create: `app/api/agile-store/[id]/action/route.ts`
- Create: `src/features/agile-store/services/agile-store-client.ts`
- Test: `app/api/agile-store/route.test.ts`

- [ ] Write failing route tests for query forwarding, detail path, action mapping and session guard.
- [ ] Run route tests and confirm failures.
- [ ] Implement bridges with `readAuthSession` and `serverApiFetch`.
- [ ] Implement the browser client using `httpClient`.
- [ ] Rerun route tests until green.

### Task 3: Public pages

**Files:**
- Create: `app/(protected)/agile-store/page.tsx`
- Create: `app/(protected)/agile-store/[id]/page.tsx`
- Create: `src/features/agile-store/components/agile-store-list-page.tsx`
- Create: `src/features/agile-store/components/agile-store-detail-page.tsx`
- Test: `src/features/agile-store/components/agile-store-pages.test.tsx`

- [ ] Write failing component tests for a rendered module card and disabled blocked action.
- [ ] Run component tests and confirm failures.
- [ ] Implement the two pages and focused components.
- [ ] Rerun component tests until green.

### Task 4: Navigation, i18n and docs

**Files:**
- Modify: `src/features/auth/services/permissions.ts`
- Modify: `src/components/navigation/menu-items.ts`
- Modify: `src/i18n/dictionaries/pt-BR.ts`
- Modify: `src/i18n/dictionaries/en-US.ts`
- Create: `docs/50-modulo-agile-store.md`
- Modify: `docs/README.md`
- Modify: `_workspace/legacy-parity-2026-03-24/*`

- [ ] Add the feature permission key and route mapping.
- [ ] Add dictionary keys for visible strings.
- [ ] Document the migrated scope and the deferred SAC/retaguarda scope.
- [ ] Update the legacy parity inventory evidence.

### Task 5: Verification and publish

- [ ] Run focused Vitest suites for Agile Store.
- [ ] Run `.\npmw.cmd run typecheck`.
- [ ] Run `.\npmw.cmd run lint`.
- [ ] Run `git diff --check`.
- [ ] Commit and push `codex/legacy-parity-inventario`.
