# formularios

Legacy commits checked:

- `ebffcf6c2` - fix: corrige mascara monetaria em formularios
- `2a9031711` - Corrige invalidacao de cache em formularios
- `38e632764` - Ajusta invalidacao segmentada de formularios
- `4af61f7e3` - Ajuste do modulo de Envios de Formularios

## Current v2 coverage found

- `formularios` and `formularios_campos` already had dedicated CRUD bridges.
- `consultas/envios-de-formularios` already had list, detail and export bridges, but only embedded `cliente` on list/detail and omitted person metadata from export.
- The money mask fix from `ebffcf6c2` touched `compre-ganhe` and `produtos-tabelas-preco`, not the `formularios` module. No migration was needed in this batch.

## Migrated in this batch

- Added contact fallback parity for form submissions:
  - list and detail now embed `cliente` and `contato`;
  - person name resolves `nome_fantasia`, `razao_social`, then `nome`;
  - person document resolves `cnpj_cpf`, then `cnpj`, then `cpf`;
  - list display formats CPF/CNPJ while export keeps the raw legacy value.
- Expanded the customer filter in the submissions list to search both customer and contact names.
- Added export metadata columns aligned with legacy output:
  - `data_envio`
  - `cnpj_cpf`
  - `nome_fantasia`
- Added segmented cache invalidation after successful form and form-field mutations:
  - `formularios` invalidates `cache/clear/Formulario`;
  - `formularios_campos` invalidates `cache/clear/FormularioCampo`;
  - form-field reordering uses the same `POST` bridge and invalidates the field cache on success.

## Coverage and validation

- `app/api/consultas/envios-de-formularios/route.test.ts`
- `app/api/formularios/route.test.ts`
- `app/api/formularios-campos/route.test.ts`
- `npxw.cmd vitest run app/api/formularios/route.test.ts app/api/formularios-campos/route.test.ts app/api/consultas/envios-de-formularios/route.test.ts`
- `npxw.cmd vitest run app/api/formularios/route.test.ts app/api/formularios-campos/route.test.ts app/api/consultas/envios-de-formularios/route.test.ts src/features/consultas-envios-formularios/services/envios-formularios-files.test.ts`
- `npxw.cmd eslint app/api/consultas/envios-de-formularios/route.ts app/api/consultas/envios-de-formularios/[id]/route.ts app/api/consultas/envios-de-formularios/export/route.ts app/api/consultas/envios-de-formularios/_person.ts app/api/consultas/envios-de-formularios/route.test.ts app/api/formularios/route.ts app/api/formularios/route.test.ts app/api/formularios-campos/route.ts app/api/formularios-campos/route.test.ts src/services/http/cache-invalidation.ts src/features/consultas-envios-formularios/services/envios-formularios-files.test.ts`
- `npmw.cmd run typecheck`
- `npmw.cmd run lint`
- `npmw.cmd run build`

## Validation note

- `npmw.cmd test` was also executed. The new `formularios` and `envios-de-formularios` tests passed, but the full suite still has the unrelated existing failure in `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`: the test expects `script: null` in `buildAcaoPayload`, while the current payload omits `script`.
