'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { toLookupOption } from '@/src/lib/lookup-options'

function normalizeLookup(record: CrudRecord) {
  const relatedBranch = [record.id_filial_padrao_lookup, record.filial_padrao, record.filial]
    .find((value) => value && typeof value === 'object' && value !== null) as { id?: unknown; nome_fantasia?: unknown; nome?: unknown; label?: unknown } | undefined

  return {
    ...record,
    id_filial_padrao_lookup: toLookupOption(relatedBranch, ['label', 'nome_fantasia', 'nome'], record.id_filial_padrao),
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
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
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
    ],
  }],
  normalizeRecord: normalizeLookup,
  beforeSave: (record) => ({
    ...record,
    id_filial_padrao: String(record.id_filial_padrao || '').trim() || null,
    id_filial_padrao_lookup: undefined,
  }),
}
