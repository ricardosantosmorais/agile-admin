'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const LINHAS_CONFIG: CrudModuleConfig = {
  key: 'linhas',
  resource: 'linhas',
  routeBase: '/linhas',
  featureKey: 'linhas',
  listTitleKey: 'simpleCrud.modules.linhas.title',
  listTitle: 'Linhas',
  listDescriptionKey: 'simpleCrud.modules.linhas.listDescription',
  listDescription: 'Server-side listing with the main columns from the legacy admin.',
  formTitleKey: 'simpleCrud.modules.linhas.formTitle',
  formTitle: 'Linha',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catalog',
  breadcrumbModuleKey: 'simpleCrud.modules.linhas.title',
  breadcrumbModule: 'Lines',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Name', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${record.id}`,
  sections: [{ id: 'main', titleKey: 'simpleCrud.sections.main', title: 'Main data', layout: 'rows', fields: [
    { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', type: 'toggle' },
    { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', type: 'text' },
    { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Name', type: 'text', required: true },
  ] }],
}
