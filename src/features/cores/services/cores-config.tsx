import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const CORES_CONFIG: CrudModuleConfig = {
  key: 'cores',
  resource: 'cores',
  routeBase: '/cores',
  featureKey: 'cores',
  listTitleKey: 'simpleCrud.modules.cores.title',
  listTitle: 'Cores',
  listDescriptionKey: 'simpleCrud.modules.cores.listDescription',
  listDescription: 'Listing with code, name and active status.',
  formTitleKey: 'simpleCrud.modules.cores.formTitle',
  formTitle: 'Cor',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catalog',
  breadcrumbModuleKey: 'simpleCrud.modules.cores.title',
  breadcrumbModule: 'Colors',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Name',
      sortKey: 'nome',
      tdClassName: 'font-semibold text-slate-950',
      render: (record) => {
        const hexa1 = typeof record.hexa1 === 'string' ? record.hexa1 : ''
        const hexa2 = typeof record.hexa2 === 'string' ? record.hexa2 : ''
        const gradient = hexa2 ? `linear-gradient(145deg, ${hexa1} 50%, ${hexa2} 50%)` : hexa1 || '#d4d4d8'

        return (
          <div className="flex items-center gap-3">
            <span className="block h-7 w-10 shrink-0 rounded-full border border-slate-200" style={{ background: gradient }} />
            <span className="truncate">{String(record.nome || '-')}</span>
          </div>
        )
      },
      filter: { kind: 'text', key: 'nome::like' },
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${record.id}`,
  details: [
    { key: 'hexa1', labelKey: 'simpleCrud.fields.primaryHex', label: 'Primary hex', render: (record) => String(record.hexa1 || '-') },
    { key: 'hexa2', labelKey: 'simpleCrud.fields.secondaryHex', label: 'Secondary hex', render: (record) => String(record.hexa2 || '-') },
  ],
    sections: [{ id: 'main', titleKey: 'simpleCrud.sections.main', title: 'Main data', layout: 'rows', fields: [
    { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', type: 'toggle' },
    { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', type: 'text' },
    { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Name', type: 'text', required: true },
    { key: 'hexa1', labelKey: 'simpleCrud.fields.primaryHex', label: 'Primary hex', type: 'color', required: true, placeholder: '#000000', layoutClassName: 'max-w-md' },
    { key: 'hexa2', labelKey: 'simpleCrud.fields.secondaryHex', label: 'Secondary hex', type: 'color', placeholder: '#000000', layoutClassName: 'max-w-md' },
  ] }],
}
