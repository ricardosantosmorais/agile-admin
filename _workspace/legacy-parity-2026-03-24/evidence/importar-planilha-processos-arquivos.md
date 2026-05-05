# Evidence: importar-planilha/processos-arquivos

## Legacy commit checked

- `30d295d53` - `fix(processos-arquivos): filtrar campos por integra_planilha no mapeamento`

## Legacy behavior

- `assets/js/components/processos-arquivos-form.js` changed the mapping field filter from `campo.integra == 1` to `campo.integra_planilha == 1`.
- `boot.php` only bumped asset version and has no v2 migration target.

## V2 comparison

- `app/api/processos-arquivos/[id]/mapeamento/route.ts` already requests dictionary tables with `integra_planilha=1`.
- Embedded `campos` were normalized in `src/features/importar-planilha/services/importar-planilha-mappers.ts` without field-level filtering.

## Migration

- Added `shouldIncludeDictionaryField` to keep fields without the flag for backward-compatible payloads and to exclude fields where `integra_planilha` is present but falsey.
- Added regression coverage in `src/features/importar-planilha/services/importar-planilha-mappers.test.ts`.

## Validation

- RED: `.\npmw.cmd test -- src/features/importar-planilha/services/importar-planilha-mappers.test.ts` failed because `CAM3` was still included.
- GREEN: same command passed after filtering by `integra_planilha`.
- Final checks:
  - `.\npxw.cmd eslint . --max-warnings 0`
  - `.\npmw.cmd run typecheck`
  - `.\npmw.cmd test -- src/features/importar-planilha/services/importar-planilha-mappers.test.ts app/api/integracoes/gateways-pagamento/route.test.ts src/features/gateways-pagamento/services/gateways-pagamento-config.test.ts`
  - `.\npmw.cmd run build`
