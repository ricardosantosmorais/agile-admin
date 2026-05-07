# filiais

Legacy commits checked:

- `ffc628e25` - Atualiza parametro `exibe_precos_filial` por perfil
- `b62a73def` - Move parametro de filiais para produtos
- `7d05230f6` - Ajusta autocomplete de grupos de filiais
- `00efbc393` - Adiciona campos complementares em filiais
- `1330409d5` - Ajusta opcoes de `seleciona_filial` no admin

## Current v2 coverage found

- `Configuracoes > Produtos` already had `exibe_precos_filial` in the product settings form with profile options and legacy boolean normalization.
- `Configuracoes > Clientes` still treated `seleciona_filial` as a yes/no parameter.
- `Filiais` had the base CRUD and group lookup, but did not expose the complementary fields added in the legacy form.
- `Grupos de filiais` had only the default branch lookup.

## Migrated in this batch

- Changed `seleciona_filial` in customer settings to the legacy profile options: `cliente`, `vendedor`, `todos`, `nao`.
- Kept compatibility for old boolean values in `seleciona_filial`: truthy values become `todos`, falsy values become `nao`.
- Added branch complementary fields:
  - `selecionavel`
  - `id_tabela_preco`
  - `variacao`
  - `distancia_maxima`
  - `ufs_excecao`
  - `ufs_restricao`
- Added branch payload normalization for lookup IDs, variation, distance, contact alias, and UF lists.
- Added group-branch complementary lookups:
  - `id_filial_nf`
  - `id_tabela_preco`
- Added form embeds for branch/group related records so lookup labels are restored in edit mode.
- Updated PT/EN i18n and module coverage docs.

## Coverage and validation

- `src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts`
- `src/features/filiais/services/filiais-config.test.ts`
- `src/features/grupos-filiais/services/grupos-filiais-config.test.ts`
- `npxw.cmd vitest run src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts src/features/filiais/services/filiais-config.test.ts src/features/grupos-filiais/services/grupos-filiais-config.test.ts`
- `npxw.cmd eslint src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.ts src/features/configuracoes-clientes/services/configuracoes-clientes-mappers.test.ts src/features/filiais/services/filiais-config.tsx src/features/filiais/services/filiais-config.test.ts src/features/grupos-filiais/services/grupos-filiais-config.tsx src/features/grupos-filiais/services/grupos-filiais-config.test.ts src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts`
- `npmw.cmd run typecheck`
- `npmw.cmd run lint`
- `npmw.cmd run build`

## Validation note

- `npmw.cmd test` was also executed. The new `filiais` tests passed, but the full suite still has an unrelated existing failure in `src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes.test.ts`: the test expects `script: null` in `buildAcaoPayload`, while the current payload omits `script`.
