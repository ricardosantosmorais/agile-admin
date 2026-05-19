# Configuracoes Parametros Filial Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar para o v2 a paridade do commit legado `a3540b52c`, fazendo o filtro de Filial em Configuracoes > Parametros usar lookup/autocomplete e enviar `id_filial`.

**Architecture:** A tela v2 ja possui listagem propria com `AppDataTable` e `DataTableFiltersCard`. A mudanca deve ficar limitada ao contrato de filtros da feature Parametros e a bridge `app/api/configuracoes/parametros`, reaproveitando o lookup global `/api/lookups/filiais`.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, bridges `app/api/*`, componentes compartilhados `DataTableFiltersCard` e `LookupSelect`.

---

## Files

- Modify: `src/features/parametros/services/parametros-types.ts`
  - Adicionar `id_filial` e `id_filial_label` aos filtros da listagem.
  - Remover ou deixar de usar `filial` como filtro textual.
- Modify: `src/features/parametros/services/parametros-client.ts`
  - Enviar `id_filial` no query string da listagem.
  - Nao enviar `filial` textual.
- Modify: `src/features/parametros/components/parametros-list-page.tsx`
  - Trocar o filtro da coluna Filial para `kind: 'lookup'`.
  - Usar `loadCatalogLookupOptions('filiais', query, page, perPage)`.
  - Manter resumo legivel usando `id_filial_label`.
- Modify: `app/api/configuracoes/parametros/route.ts`
  - Ler `id_filial` da URL.
  - Encaminhar `id_filial` para `empresas/parametros`.
  - Remover o filtro textual `filial:nome_fantasia::like` quando `id_filial` estiver presente.
- Test: `src/features/parametros/services/parametros-mappers.test.ts` ou novo `src/features/parametros/services/parametros-client.test.ts`
  - Cobrir que os filtros aceitam `id_filial`.
- Test: novo teste de bridge se ja houver padrao local simples para route handlers em Parametros; caso contrario, declarar gap no fechamento.
- Docs: documento de modulo correspondente em `docs/`, se existir secao de Configuracoes > Parametros.

## Tasks

### Task 1: Ajustar tipos e cliente da listagem

**Files:**
- Modify: `src/features/parametros/services/parametros-types.ts`
- Modify: `src/features/parametros/services/parametros-client.ts`

- [ ] **Step 1: Atualizar o tipo de filtros**

Em `src/features/parametros/services/parametros-types.ts`, alterar `ParametroListFilters` para incluir:

```ts
id_filial: string
id_filial_label: string
```

Manter `orderBy` com `'filial:nome_fantasia'`, porque a ordenacao da coluna continua por nome da filial.

- [ ] **Step 2: Atualizar o cliente da listagem**

Em `src/features/parametros/services/parametros-client.ts`, ajustar `parametrosClient.list` para enviar:

```ts
id_filial: filters.id_filial
```

Remover o envio de:

```ts
filial: filters.filial
```

- [ ] **Step 3: Rodar teste focado existente**

Run:

```powershell
.\npxw.cmd vitest run src/features/parametros/services/parametros-mappers.test.ts --configLoader native
```

Expected:

```text
PASS
```

### Task 2: Trocar filtro de Filial para lookup na UI

**Files:**
- Modify: `src/features/parametros/components/parametros-list-page.tsx`

- [ ] **Step 1: Importar lookup compartilhado**

Adicionar:

```ts
import { loadCatalogLookupOptions } from '@/src/features/catalog/services/catalog-lookups'
```

- [ ] **Step 2: Atualizar DEFAULT_FILTERS**

Trocar o campo textual:

```ts
filial: '',
```

por:

```ts
id_filial: '',
id_filial_label: '',
```

- [ ] **Step 3: Atualizar filtro da coluna Filial**

Na coluna `filial`, trocar:

```ts
filter: { kind: 'text', id: 'filial', key: 'filial', label: t('parameters.fields.branch', 'Filial') },
```

por:

```ts
filter: {
  kind: 'lookup',
  id: 'id_filial',
  key: 'id_filial',
  label: t('parameters.fields.branch', 'Filial'),
  loadOptions: (query, page, perPage) => loadCatalogLookupOptions('filiais', query, page, perPage),
  pageSize: 15,
},
```

- [ ] **Step 4: Conferir que limpar filtros tambem limpa label**

Confirmar que `onClear` usa `DEFAULT_FILTERS`. Como `DEFAULT_FILTERS` tera `id_filial_label: ''`, o resumo do filtro deve limpar junto.

### Task 3: Ajustar bridge para `id_filial`

**Files:**
- Modify: `app/api/configuracoes/parametros/route.ts`

- [ ] **Step 1: Trocar filtro enviado ao backend**

Na constante `filters`, trocar:

```ts
'filial:nome_fantasia::like': searchParams.get('filial') || '',
```

por:

```ts
id_filial: searchParams.get('id_filial') || '',
```

- [ ] **Step 2: Preservar demais filtros**

Confirmar que estes filtros continuam iguais:

```ts
id: searchParams.get('id') || '',
'chave::like': searchParams.get('chave') || '',
'descricao::like': searchParams.get('descricao') || '',
'parametros::like': searchParams.get('parametros') || '',
posicao: searchParams.get('posicao') || '',
permissao: searchParams.get('permissao') || '',
ativo: searchParams.get('ativo') || '',
```

### Task 4: Adicionar cobertura focada

**Files:**
- Prefer: novo teste de route handler para `app/api/configuracoes/parametros/route.ts`, se o padrao local permitir mockar `readAuthSession` e `serverApiFetch`.
- Fallback: teste de cliente ou mapeador que proteja o shape de `ParametroListFilters`.

- [ ] **Step 1: Procurar padrao local de teste de route handler**

Run:

```powershell
rg -n "serverApiFetchMock|readAuthSession|new NextRequest" app/api src/features/parametros
```

Expected:

```text
Encontrar exemplos em app/api/*/*.test.ts ou confirmar ausencia de padrao especifico para Parametros.
```

- [ ] **Step 2: Criar teste se houver padrao reutilizavel**

O teste deve chamar `GET` com:

```text
http://localhost/api/configuracoes/parametros?page=1&perpage=15&id_filial=123
```

E validar que `serverApiFetch` recebeu path contendo:

```text
id_filial=123
```

E nao contendo:

```text
filial%3Anome_fantasia%3A%3Alike
```

- [ ] **Step 3: Se teste de route handler for pesado demais, documentar o gap**

No fechamento, registrar:

```text
Teste de route handler nao foi adicionado porque Parametros ainda nao possui padrao local de mock para app/api/configuracoes/parametros; validacao ficou em teste focado de cliente/mapeador e revisao do query string.
```

### Task 5: Validar e fechar

**Files:**
- Possibly modify docs if behavior documentation exists.

- [ ] **Step 1: Rodar teste focado**

Run:

```powershell
.\npxw.cmd vitest run <arquivo-de-teste-tocado> --configLoader native
```

Expected:

```text
PASS
```

- [ ] **Step 2: Rodar whitespace check**

Run:

```powershell
git -c safe.directory=C:/Projetos/admin-v2-web diff --check
```

Expected:

```text
Sem erros de whitespace.
```

- [ ] **Step 3: Revisar diff**

Run:

```powershell
git -c safe.directory=C:/Projetos/admin-v2-web diff -- src/features/parametros app/api/configuracoes/parametros
```

Expected:

```text
Diff limitado a Parametros, bridge de Parametros e testes/docs necessarios.
```

- [ ] **Step 4: Atualizar artefatos da rodada**

Atualizar:

```text
_workspace/legacy-parity-2026-05-19/upcoming-roadmap.md
```

com o status da fatia quando concluida.

