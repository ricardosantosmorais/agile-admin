# Evidence: controllers

Run: legacy-parity-2026-03-24
Legacy commits: `8df9be0ff`, `f4235fad3`, `2c4ee3ef4`, `c5e30a6c7`, `929884d06`
V2 branch: `codex/legacy-parity-inventario`

## Resultado do lote

- `8df9be0ff` migrado: o Editor SQL do v2 deixou de consultar `protheus_tipo_integracao` para decidir alvo de execucao e agora envia consultas, inclusive `ERP`, sempre para o `PainelB2BApi`.
- `f4235fad3` migrado: a rotina v2 de renovacao ja usava a API efetiva do cluster quando disponivel; o helper compartilhado de invalidacao agora tambem suporta cache completo em `cache/clear`.
- `2c4ee3ef4` migrado: `Componentes`, `Componentes Campos` e `Areas de Pagina` invalidam o cache completo apos mutacoes bem-sucedidas.
- `c5e30a6c7` nao aplicavel diretamente ao v2: nao existe modulo/superficie de `billing-upgrade` no Admin v2 atual.
- `929884d06` migrado: falhas da chamada direta de renovacao de cache no cluster agora sao registradas no Sentry como evento operacional `remote-cache`.

## Arquivos alterados

- `app/api/editor-sql/_shared.ts`
- `app/api/editor-sql/_shared.test.ts`
- `app/api/renovar-cache/route.ts`
- `app/api/renovar-cache/route.test.ts`
- `app/api/componentes/route.ts`
- `app/api/componentes/route.test.ts`
- `app/api/componentes-campos/route.ts`
- `app/api/componentes-campos/route.test.ts`
- `app/api/areas-paginas/route.ts`
- `app/api/areas-paginas/route.test.ts`
- `src/services/http/cache-invalidation.ts`
- `src/services/http/cache-invalidation.test.ts`
- `docs/02-stack-e-execucao.md`
- `docs/06-modulos-e-cobertura-atual.md`
- `docs/33-modulo-ferramentas-editor-sql.md`

## Validacao focada

```powershell
.\npxw.cmd vitest run app/api/editor-sql/_shared.test.ts app/api/renovar-cache/route.test.ts src/services/http/cache-invalidation.test.ts app/api/componentes/route.test.ts app/api/componentes-campos/route.test.ts app/api/areas-paginas/route.test.ts
```

Resultado:

- Testes focados: 6 arquivos, 11 testes passando.

## Validacao geral

```powershell
.\npxw.cmd eslint app/api/editor-sql/_shared.ts app/api/editor-sql/_shared.test.ts app/api/renovar-cache/route.ts app/api/renovar-cache/route.test.ts app/api/componentes/route.ts app/api/componentes/route.test.ts app/api/componentes-campos/route.ts app/api/componentes-campos/route.test.ts app/api/areas-paginas/route.ts app/api/areas-paginas/route.test.ts src/services/http/cache-invalidation.ts src/services/http/cache-invalidation.test.ts
.\npmw.cmd run typecheck
.\npmw.cmd run lint
.\npmw.cmd run build
```

Resultados:

- ESLint focado: sem erros.
- Typecheck: passou.
- Lint completo: passou.
- Build: passou, com 424 paginas geradas.

## Validacao completa pendente

```powershell
.\npmw.cmd test
```

Resultado: a suite completa segue bloqueada por falha preexistente e nao relacionada em `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`, no teste `monta payload limpo para salvar`: o teste espera `script: null`, mas o payload atual omite `script`. Nesta execucao, 202 arquivos foram executados, 201 passaram e 1 falhou; 507 testes foram executados, 506 passaram e 1 falhou pelo blocker descrito.
