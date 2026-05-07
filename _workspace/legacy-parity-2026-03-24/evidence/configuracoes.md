# Evidence: configuracoes

Run: legacy-parity-2026-03-24
Legacy commits: `22638a2f5`, `e4a8c7358`, `652569364`, `fe2db7d06`, `4da2066cc`, `4c30ba50c`, `60ea3435f`, `c463a8957`, `e4356e219`, `4e70062f0`, `25d54d0b3`, `e3007392e`
V2 branch: `codex/legacy-parity-inventario`

## Resultado do lote

- `22638a2f5` já coberto: `Configurações > Produtos` já possui o parâmetro `exibe_precos_filial`; a diferença do legado é texto de ajuda do modal de preços, sem impacto funcional no v2.
- `e4a8c7358` já coberto: `Configurações > Produtos` já possui `exibe_estoque_assistente_pesquisa`, com normalização de valores booleanos legados para `todos`/`nao`.
- `652569364`, `fe2db7d06`, `4da2066cc`, `4c30ba50c`, `60ea3435f` e `c463a8957` já cobertos: `Configurações > Geral` no v2 usa o schema editável e as opções fixas vindas de `configuracoes_empresa`, sem depender do experimento intermediário de clusters do legado.
- `e4356e219` não aplicável diretamente ao v2: inicialização de parâmetros ao publicar versão do cache pertence ao controller legado de cache.
- `4e70062f0` migrado: `Configurações > Vendedores` ganhou os parâmetros da Área Representante V2: `area_representante`, `preco_flexivel`, `acrescimo_maximo`, `desconto_maximo`.
- `25d54d0b3` migrado: `area_representante=v1` é serializado como `null`, preservando a lógica do controller legado.
- `e3007392e` migrado: `quantidade_cotas_vendedor` entrou nas configurações com edição restrita a usuário master, e o cadastro de vendedores ganhou `area_vendedor` com bloqueio na bridge quando a Área V2 não está ativa ou não há cotas disponíveis.

## Arquivos alterados

- `app/api/configuracoes/vendedores/route.ts`
- `app/api/vendedores/route.ts`
- `app/api/vendedores/route.test.ts`
- `src/features/configuracoes-vendedores/components/configuracoes-vendedores-form-sections.tsx`
- `src/features/configuracoes-vendedores/components/configuracoes-vendedores-page.tsx`
- `src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers.ts`
- `src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers.test.ts`
- `src/features/configuracoes-vendedores/types/configuracoes-vendedores.ts`
- `src/features/vendedores/components/vendedor-form-page.tsx`
- `src/features/vendedores/services/vendedores-form.ts`
- `src/features/vendedores/services/vendedores-form.test.ts`
- `src/features/vendedores/types/vendedores.ts`
- `src/i18n/dictionaries/pt-BR.ts`
- `src/i18n/dictionaries/en-US.ts`
- `docs/40-modulo-configuracoes-pedidos-precos-produtos-vendedores.md`
- `docs/06-modulos-e-cobertura-atual.md`

## Validacao focada

```powershell
.\npxw.cmd vitest run src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers.test.ts src/features/vendedores/services/vendedores-form.test.ts app/api/vendedores/route.test.ts
```

Resultado: 3 arquivos, 8 testes passando.

## Validacao geral

```powershell
.\npxw.cmd eslint app/api/configuracoes/vendedores/route.ts app/api/vendedores/route.ts app/api/vendedores/route.test.ts src/features/configuracoes-vendedores/components/configuracoes-vendedores-form-sections.tsx src/features/configuracoes-vendedores/components/configuracoes-vendedores-page.tsx src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers.ts src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers.test.ts src/features/configuracoes-vendedores/types/configuracoes-vendedores.ts src/features/vendedores/components/vendedor-form-page.tsx src/features/vendedores/services/vendedores-form.ts src/features/vendedores/services/vendedores-form.test.ts src/features/vendedores/types/vendedores.ts src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts
.\npmw.cmd run typecheck
.\npmw.cmd run lint
.\npmw.cmd run build
git diff --check
```

Resultados:

- ESLint focado: sem erros.
- Typecheck: passou.
- Lint completo: passou.
- Build: passou, com 424 paginas geradas.
- `git diff --check`: sem problemas de whitespace.
- Encoding dos dicionarios `pt-BR` e `en-US`: sem U+FFFD e com as novas chaves de Area V2 presentes.

## Validacao completa pendente

```powershell
.\npmw.cmd test
```

Resultado: a suite completa segue bloqueada por falha preexistente e nao relacionada em `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`, no teste `monta payload limpo para salvar`: o teste espera `script: null`, mas o payload atual omite `script`.
