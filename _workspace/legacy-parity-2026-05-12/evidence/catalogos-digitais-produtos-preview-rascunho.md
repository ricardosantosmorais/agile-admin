# Evidencia - Catalogos Digitais - produtos, colecoes e preview de rascunho

Data: 2026-05-18
Branch: `codex/catalogos-digitais-listagem-publica`

## Legado consultado

- `C:\Projetos\admin\components\catalogos-studio.php`
- `C:\Projetos\admin\assets\js\components\catalogos-studio.js`
- `C:\Projetos\admin\controllers\catalogos-studio-controller.php`
- `C:\Projetos\admin\includes\catalogos-digitais-permissions.php`

## Comportamento legado preservado

- Busca de produtos usa `produtos` na API v3 com `id_empresa`, ordenacao por nome e filtro por nome, codigo ou ID.
- Resolucao de produtos aceita lista separada por espaco, virgula, ponto e virgula ou pipe, com limite operacional de 120 itens e retorno dos nao encontrados.
- Busca/importacao de colecoes usa `colecoes`; a importacao carrega `embed=produtos`, resolve os produtos reais e preserva a ordem da colecao.
- Preview HTML do Studio pode renderizar a partir de um payload/snapshot de rascunho, sem depender de URL publica.

## Implementacao v2

- `POST /api/catalogos-digitais/studio` foi adicionado com as acoes:
  - `searchProducts`
  - `resolveProducts`
  - `searchCollections`
  - `importCollection`
  - `previewDraft`
- O client v2 ganhou metodos para buscar produtos, importar colecao e gerar previa de rascunho.
- O editor de blocos agora permite buscar produtos, resolver codigos/IDs, importar uma colecao por ID e adicionar produtos ao bloco sem perder `form.products`.
- O resumo ganhou o botao `Previa do rascunho`, que abre o HTML renderizado em nova aba a partir do estado atual do builder.
- Strings novas foram adicionadas em PT/EN.

## Validacoes executadas

```powershell
.\npxw.cmd vitest run app/api/catalogos-digitais/route.test.ts src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx src/features/catalogos-digitais/components/catalogos-digitais-list-page.test.tsx src/features/catalogos-digitais/services/catalogos-digitais-client.test.ts src/features/catalogos-digitais/services/catalogos-digitais-mappers.test.ts --testTimeout=15000
```

Resultado original desta fatia: 5 arquivos, 28 testes, todos passando.

```powershell
.\npxw.cmd eslint app/api/catalogos-digitais/studio/route.ts src/features/catalogos-digitais/components/catalogos-digitais-form-page.tsx src/features/catalogos-digitais/services/catalogos-digitais-client.ts src/features/catalogos-digitais/types/catalogos-digitais.ts app/api/catalogos-digitais/route.test.ts src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx
```

Resultado: sem erros.

```powershell
.\npmw.cmd run typecheck
```

Resultado: `tsc --noEmit` sem erros.

## Pendencias reais

- Precificacao/recalculo foi retomado na evidencia `catalogos-digitais-precificacao-pdf-publicacao.md`.
- PDF/publicacao ainda precisa de decisao de contrato v2; esta fatia entregou preview HTML, nao a geracao completa de PDF ou publicacao.
- A validacao funcional com dados reais e a comparacao visual com o legado em PT/EN, desktop/mobile e light/dark ainda nao foram executadas nesta fatia.
