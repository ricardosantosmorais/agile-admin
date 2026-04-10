import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const PORTOS_CONFIG: CrudModuleConfig = {
  key: 'portos',
  resource: 'portos',
  routeBase: '/portos',
  featureKey: 'portos',
  listTitleKey: 'logistics.portos.title',
  listTitle: 'Portos',
  listDescriptionKey: 'logistics.portos.listDescription',
  listDescription: 'Listagem com código, nome e status ativo.',
  formTitleKey: 'logistics.portos.formTitle',
  formTitle: 'Porto',
  breadcrumbSectionKey: 'routes.logistica',
  breadcrumbSection: 'Logística',
  breadcrumbModuleKey: 'routes.portos',
  breadcrumbModule: 'Portos',
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
    titleKey: 'logistics.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
    ],
  }],
}
