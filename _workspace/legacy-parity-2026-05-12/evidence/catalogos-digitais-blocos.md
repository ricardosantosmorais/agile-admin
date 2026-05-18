# Evidence - Catálogos Digitais / Blocos

Data: 2026-05-18
Branch: `codex/catalogos-digitais-studio-slice`

## Legado comparado

- `components/catalogos-studio.php`
- `controllers/catalogos-studio-controller.php`
- `assets/js/components/catalogos-studio.js`

O legado monta o Studio em três etapas e usa `metadata.snapshot.secoes` como contrato central dos blocos. Os tipos funcionais observados no JS legado foram preservados no v2: `banner`, `titulo`, `produtos_grid`, `produtos_lista`, `texto`, `cta`, `divisor`, `espacador` e `quebra_pagina`.

## Implementado no v2

- Etapa `Blocos` deixou de ser apenas resumo e passou a criar, editar, reordenar e remover blocos.
- O editor grava campos visuais e operacionais do bloco no snapshot: modelo, textos, imagem por URL, cores, espaçamento, fonte, produtos e exibição de preço.
- O payload de save continua preservando `metadata.snapshot.secoes`, sem criar contrato paralelo no frontend.

## Testes focados

```powershell
.\npxw.cmd vitest run src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx src/features/catalogos-digitais/services/catalogos-digitais-mappers.test.ts --testTimeout=15000
```

Resultado: 2 arquivos, 8 testes passando.

## Pendências reais

- Upload tenant-aware de imagem ainda não foi migrado.
- Busca/importação de produtos e coleções ainda não foi migrada.
- Precificação/recalculo, preview HTML, PDF e publicação seguem pendentes.
