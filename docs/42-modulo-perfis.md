# 42 - Modulo Perfis

## Objetivo
`Perfis` fecha o menu `Administração` no v2 com:
- listagem server-side;
- criação;
- edição;
- seleção hierárquica de acessos.

O módulo mantém a regra funcional do legado, mas sem depender de `jstree`.

## Estrutura da feature

Arquivos principais:
- [perfis-list-page.tsx](../src/features/perfis/components/perfis-list-page.tsx)
- [perfil-form-page.tsx](../src/features/perfis/components/perfil-form-page.tsx)
- [perfis-client.ts](../src/features/perfis/services/perfis-client.ts)
- [perfis-mappers.ts](../src/features/perfis/services/perfis-mappers.ts)
- [perfis-config.tsx](../src/features/perfis/services/perfis-config.tsx)
- [tree-multi-select.tsx](../src/components/ui/tree-multi-select.tsx)
- [tree-selection.ts](../src/lib/tree-selection.ts)

## Papel arquitetural do modulo
`Perfis` e um CRUD administrativo hibrido:
- a listagem segue o mesmo padrao de `Administradores`;
- o formulario e proprio, porque a arvore de acessos e a regra central da tela.

Isso evita forcar a tela em `CrudFormPage` quando a parte mais importante nao e linear.

## Listagem

### Base usada
A listagem usa:
- `useCrudListController`;
- `AppDataTable`;
- `PageHeader`;
- `ConfirmDialog`.

O comportamento cobre:
- filtros por `ID`, `Código`, `Nome` e `Ativo`;
- ordenação server-side;
- exclusão simples e em lote;
- navegação para criar e editar.

## Formulario

### Dados principais
O formulario trabalha com:
- `ativo`;
- `codigo`;
- `nome`.

### Arvore de acessos
O legado usava `jstree` e enviava:
- os nós marcados;
- os pais parcialmente marcados.

No v2, isso foi mantido na regra, mas a UI passou a usar:
- [tree-multi-select.tsx](../src/components/ui/tree-multi-select.tsx)
- [tree-selection.ts](../src/lib/tree-selection.ts)

Essa base generica oferece:
- selecao em cascata;
- estado parcial;
- serializacao reutilizavel para payload.

## Bridges

Rotas novas:
- [app/api/perfis/route.ts](../app/api/perfis/route.ts)
- [app/api/perfis/[id]/route.ts](../app/api/perfis/[id]/route.ts)
- [app/api/perfis/acessos/route.ts](../app/api/perfis/acessos/route.ts)

### Regras trazidas do legado
- listagem em `perfis`;
- gravação em `perfis`;
- carga da arvore em `funcionalidades?ativo=1&restrito=0...&embed=empresas`;
- filtro das funcionalidades pela empresa atual do tenant;
- carga dos acessos atuais do perfil com `embed=funcionalidades`.

## Menu e permissao

O modulo entrou em:
- [permissions.ts](../src/features/auth/services/permissions.ts)
- [menu-items.ts](../src/components/navigation/menu-items.ts)
- dicionarios e traducoes de menu

Com isso:
- o menu dinamico consegue abrir `/perfis`;
- `useFeatureAccess('perfis')` controla listar, criar, editar, visualizar e excluir.

## Testes

Cobertura adicionada:
- unitario para serializacao da arvore em [tree-selection.test.ts](../src/lib/tree-selection.test.ts)
- unitario de mappers em [perfis-mappers.test.ts](../src/features/perfis/services/perfis-mappers.test.ts)
- E2E do fluxo principal em [perfis.spec.ts](../e2e/perfis.spec.ts)
