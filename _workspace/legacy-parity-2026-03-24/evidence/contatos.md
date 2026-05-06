# Evidence: contatos

Run: legacy-parity-2026-03-24
Legacy commits: `4b59fff2d`, `7ac000ca6`, `607636dbb`
V2 branch: `codex/legacy-parity-inventario`

## Resultado do lote

- `4b59fff2d` nao aplicavel diretamente ao v2: o commit ajusta o separador visual dos contatos no modal de pendencia financeira em `billing-upgrade`, fora da superficie funcional de `Contatos` no Admin v2.
- `7ac000ca6` migrado: `Contatos` ganhou edicao administrativa para contatos ainda nao internalizados, com acao na listagem e no detalhe, modal de edicao, normalizacao de payload e bloqueio na bridge quando o contato ja foi internalizado.
- `607636dbb` migrado: `Configuracoes > Clientes` ganhou o parametro `permite_cadastro_contato_duplicado`, com labels/helpers em PT/EN e cobertura de mapper/payload.

## Arquivos alterados

- `app/api/contatos/[id]/route.ts`
- `app/api/contatos/[id]/route.test.ts`
- `src/features/contatos/components/contato-detail-modal.tsx`
- `src/features/contatos/components/contato-detail-modal.test.tsx`
- `src/features/contatos/components/contato-edit-modal.tsx`
- `src/features/contatos/components/contatos-list-page.tsx`
- `src/features/contatos/services/contatos-client.ts`
- `src/features/contatos/services/contatos-mappers.ts`
- `src/features/contatos/services/contatos-mappers.test.ts`
- `src/features/contatos/types/contatos.ts`
- `src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.ts`
- `src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts`
- `src/features/configuracoes-clientes/types/configuracoes-clientes.ts`
- `src/i18n/dictionaries/pt-BR.ts`
- `src/i18n/dictionaries/en-US.ts`
- `docs/22-modulo-pessoas-complementares.md`
- `docs/06-modulos-e-cobertura-atual.md`

## Validacao focada

```powershell
.\npxw.cmd vitest run src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts src/features/contatos/services/contatos-mappers.test.ts src/features/contatos/components/contato-detail-modal.test.tsx app/api/contatos/[id]/route.test.ts
.\npxw.cmd eslint app/api/contatos/[id]/route.ts app/api/contatos/[id]/route.test.ts src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.ts src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts src/features/configuracoes-clientes/types/configuracoes-clientes.ts src/features/contatos/components/contato-detail-modal.tsx src/features/contatos/components/contato-detail-modal.test.tsx src/features/contatos/components/contato-edit-modal.tsx src/features/contatos/components/contatos-list-page.tsx src/features/contatos/services/contatos-client.ts src/features/contatos/services/contatos-mappers.ts src/features/contatos/services/contatos-mappers.test.ts src/features/contatos/types/contatos.ts src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts
```

Resultados:

- Testes focados: 4 arquivos, 12 testes passando.
- ESLint focado: sem erros.

## Validacao geral

```powershell
.\npmw.cmd run typecheck
.\npmw.cmd run lint
.\npmw.cmd run build
git diff --check
```

Resultados:

- Typecheck: passou.
- Lint completo: passou.
- Build: passou, com 424 paginas geradas.
- `git diff --check`: sem problemas de whitespace.
- Encoding dos arquivos textuais alterados: sem U+FFFD e com as novas chaves esperadas presentes.

## Validacao completa pendente

```powershell
.\npmw.cmd test
```

Resultado: a suite completa segue bloqueada por falha preexistente e nao relacionada em `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`, no teste `monta payload limpo para salvar`: o teste espera `script: null`, mas o payload atual omite `script`. Nesta execucao, 196 arquivos foram executados, 195 passaram e 1 falhou; 496 testes foram executados, 495 passaram e 1 falhou pelo blocker descrito.
