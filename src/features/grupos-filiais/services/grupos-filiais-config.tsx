import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { nullableLookupId, toLookupOption } from '@/src/lib/lookup-options'

function normalizeLookup(record: CrudRecord) {
  const relatedBranch = [record.id_filial_padrao_lookup, record.filial_padrao, record.filial]
    .find((value) => value && typeof value === 'object' && value !== null) as { id?: unknown; nome_fantasia?: unknown; nome?: unknown; label?: unknown } | undefined
  const relatedInvoiceBranch = [record.id_filial_nf_lookup, record.filial_nf]
    .find((value) => value && typeof value === 'object' && value !== null) as { id?: unknown; nome_fantasia?: unknown; nome?: unknown; label?: unknown } | undefined
  const relatedPriceTable = [record.id_tabela_preco_lookup, record.tabela_preco]
    .find((value) => value && typeof value === 'object' && value !== null) as { id?: unknown; nome?: unknown; label?: unknown } | undefined

  return {
    ...record,
    id_filial_padrao_lookup: toLookupOption(relatedBranch, ['label', 'nome_fantasia', 'nome'], record.id_filial_padrao),
    id_filial_nf_lookup: toLookupOption(relatedInvoiceBranch, ['label', 'nome_fantasia', 'nome'], record.id_filial_nf),
    id_tabela_preco_lookup: toLookupOption(relatedPriceTable, ['label', 'nome'], record.id_tabela_preco),
  }
}

export const GRUPOS_FILIAIS_CONFIG: CrudModuleConfig = {
  key: 'grupos-filiais',
  resource: 'grupos_filiais',
  routeBase: '/grupos-de-filiais',
  featureKey: 'gruposFiliais',
  listTitleKey: 'basicRegistrations.branchGroups.title',
  listTitle: 'Grupos de filiais',
  listDescriptionKey: 'basicRegistrations.branchGroups.listDescription',
  listDescription: 'Listagem com código, nome e status ativo.',
  formTitleKey: 'basicRegistrations.branchGroups.formTitle',
  formTitle: 'Grupo de filiais',
  breadcrumbSectionKey: 'routes.cadastrosBasicos',
  breadcrumbSection: 'Cadastros Básicos',
  breadcrumbModuleKey: 'routes.gruposFiliais',
  breadcrumbModule: 'Grupos de filiais',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [{
    id: 'main',
    titleKey: 'basicRegistrations.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      { key: 'id_filial_padrao', labelKey: 'basicRegistrations.branchGroups.fields.defaultBranch', label: 'Filial padrão', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_padrao_lookup' },
      { key: 'id_filial_nf', labelKey: 'basicRegistrations.branchGroups.fields.invoiceBranch', label: 'Filial NF', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_nf_lookup' },
      { key: 'id_tabela_preco', labelKey: 'basicRegistrations.branchGroups.fields.priceTable', label: 'Tabela de preço', type: 'lookup', optionsResource: 'tabelas_preco', lookupStateKey: 'id_tabela_preco_lookup' },
    ],
  }],
  formEmbed: 'filial_padrao,filial_nf,tabela_preco',
  normalizeRecord: normalizeLookup,
  beforeSave: (record) => ({
    ...record,
    codigo: String(record.codigo || '').trim() || null,
    nome: String(record.nome || '').trim(),
    id_filial_padrao: nullableLookupId(record.id_filial_padrao_lookup ?? record.id_filial_padrao),
    id_filial_nf: nullableLookupId(record.id_filial_nf_lookup ?? record.id_filial_nf),
    id_tabela_preco: nullableLookupId(record.id_tabela_preco_lookup ?? record.id_tabela_preco),
    id_filial_padrao_lookup: undefined,
    id_filial_nf_lookup: undefined,
    id_tabela_preco_lookup: undefined,
  }),
}
