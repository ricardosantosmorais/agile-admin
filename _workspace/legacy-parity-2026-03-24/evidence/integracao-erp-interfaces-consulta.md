# integracao-erp/interfaces-consulta

Legacy commits checked:

- `1b0fcff41` - feat: adiciona cadastro de interfaces de consulta no admin
- `1e291e5a5` - Refatora admin de interface de consulta
- `bc07a7a2b` - Evolui override de interface de consulta
- `933b95475` - Expone transformacao razor template no admin
- `57443d82d` - Expoe resolucao de valor no cadastro de interfaces
- `4e4ebb4c7` - Refina modal de query nas interfaces de consulta

## Current v2 coverage found

- The v2 already has the interface consultation list/form, template and override flows, query editor context/load/save/execute, alias validation, resolved configuration, and preview routes.
- The previous v2 refactor already moved the feature to native operational panels instead of reproducing the legacy modal/table layout.
- `razor_template` is already accepted by the JSON-based return mapping flow because the v2 does not constrain transformation values through the legacy select list.

## Migrated in this batch

- Added bridge normalization for consultation maps before saving template and company override endpoint mappings.
- Preserved the legacy defaults for:
  - `modo_aplicacao_filtro`: `remoto`
  - `modo_aplicacao_ordenacao`: `remoto`
  - `resolucao_valor_config`: empty string
- Kept existing explicit values such as `modo_aplicacao_filtro: local` when provided by the user/configuration.

## Coverage

- `app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared.test.ts`
- `app/api/erp-cadastros/interfaces-consulta/[id]/template-form/route.test.ts`
- `app/api/erp-cadastros/interfaces-consulta/[id]/override-form/route.test.ts`
