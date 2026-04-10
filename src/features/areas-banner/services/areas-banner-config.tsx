import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const AREAS_BANNER_CONFIG: CrudModuleConfig = {
  key: 'areasBanner',
  resource: 'areas_banner',
  routeBase: '/areas-banner',
  featureKey: 'areasBanner',
  listTitleKey: 'simpleCrud.modules.areasBanner.title',
  listTitle: 'Areas de Banner',
  listDescriptionKey: 'simpleCrud.modules.areasBanner.listDescription',
  listDescription: 'Server-side listing with code, name and active status.',
  formTitleKey: 'simpleCrud.modules.areasBanner.formTitle',
  formTitle: 'Area de Banner',
  breadcrumbSectionKey: 'simpleCrud.sections.marketing',
  breadcrumbSection: 'Marketing',
  breadcrumbModuleKey: 'simpleCrud.modules.areasBanner.title',
  breadcrumbModule: 'Banner areas',
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
