# Evidence: integracao-erp/servicos

Run: legacy-parity-2026-03-24
Legacy commits: `9a13e0879`, `02c369878`, `6e9b5f7f3`, `e6686a8f8`, `5316cdd22`, `2883f5bf3`, `e334b4312`
V2 branch: `codex/legacy-parity-inventario`

## Resultado do lote

- `9a13e0879` migrado: `Cadastros ERP > Serviços` agora oculta `modo_transformacao_gateway` fora de `endpoint_gateway`, exige `dataset_source_path` apenas no modo `dataset_consolidado` e limpa o payload de dataset consolidado quando o serviço volta para query/registro.
- `6e9b5f7f3` migrado: o modal moderno de conteúdo da execução ganhou ações de copiar conteúdo e baixar arquivo, mantendo a leitura in-place que a v2 já fazia.
- `02c369878` já coberto: a ação `abort-execution` da bridge v2 usa `context.companyCode`, equivalente ao código da empresa ativa usado no legado após o ajuste.
- `2883f5bf3` já coberto: `handleShowExecutionDetails` reseta a paginação para `DEFAULT_EXECUTION_DETAILS_PAGINATION` antes de abrir nova execução.
- `e334b4312` já coberto: abas e detalhes operacionais do serviço usam carregamento lazy por aba/modal/execução selecionada.
- `e6686a8f8` e `5316cdd22` não aplicáveis neste ponto da v2: os ajustes eram do widget/header global de diagnóstico Protheus no legado; a tela moderna de serviços não possui esse mesmo ponto de UI.

## Arquivos alterados

- `src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos.ts`
- `src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos.test.ts`
- `src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config.tsx`
- `src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config.test.tsx`
- `src/features/integracao-com-erp-servicos/components/integracao-com-erp-servicos-edit-page.tsx`
- `src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-log-actions.ts`
- `src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-log-actions.test.ts`
- `src/i18n/dictionaries/pt-BR.ts`
- `src/i18n/dictionaries/en-US.ts`
- `docs/06-modulos-e-cobertura-atual.md`

## Validacao focada

```powershell
.\npxw.cmd vitest run src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-log-actions.test.ts src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos.test.ts src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config.test.tsx src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-mappers.test.ts
```

Resultado: 4 arquivos, 12 testes passando.

## Validacao geral

```powershell
.\npxw.cmd eslint src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos.ts src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos.test.ts src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config.tsx src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config.test.tsx src/features/integracao-com-erp-servicos/components/integracao-com-erp-servicos-edit-page.tsx src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-log-actions.ts src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-log-actions.test.ts src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts
.\npmw.cmd run typecheck
.\npmw.cmd run lint
.\npmw.cmd run build
```

Resultado: comandos passando.

```powershell
.\npmw.cmd test
```

Resultado: 192 arquivos de teste passaram e 1 falhou fora deste lote, em `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`, por divergência já existente entre o teste (`script: null`) e o payload atual, que omite `script`.
