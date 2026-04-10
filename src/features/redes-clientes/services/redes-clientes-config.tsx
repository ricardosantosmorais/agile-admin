import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'

export const REDES_CLIENTES_CONFIG: CrudModuleConfig = {
  key: 'redes-clientes',
  resource: 'redes',
  routeBase: '/redes-clientes',
  featureKey: 'redesClientes',
  listTitleKey: 'people.customerNetworks.title',
  listTitle: 'Redes de clientes',
  listDescriptionKey: 'people.customerNetworks.listDescription',
  listDescription: 'Listagem server-side com código, nome e status ativo.',
  formTitleKey: 'people.customerNetworks.formTitle',
  formTitle: 'Rede de clientes',
  breadcrumbSectionKey: 'routes.people',
  breadcrumbSection: 'Pessoas',
  breadcrumbModuleKey: 'people.customerNetworks.title',
  breadcrumbModule: 'Redes de clientes',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'simpleCrud.sections.main',
      title: 'Dados principais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', maxLength: 32 },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => ({
    id: String(record.id || ''),
    ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
    codigo: String(record.codigo || ''),
    nome: String(record.nome || ''),
  }),
  beforeSave: (record: CrudRecord) => ({
    id: String(record.id || '') || undefined,
    ativo: record.ativo === true,
    codigo: String(record.codigo || '') || null,
    nome: String(record.nome || '').trim(),
  }),
}
