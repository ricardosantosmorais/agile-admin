import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { formatCpfCnpj, formatCurrency } from '@/src/lib/formatters'

function formatTipoVendedor(value: unknown) {
  switch (String(value || '').toLowerCase()) {
    case 'externo':
      return 'Externo'
    case 'receptivo':
      return 'Receptivo'
    default:
      return 'Ativo'
  }
}

export const VENDEDORES_CONFIG: CrudModuleConfig = {
  key: 'vendedores',
  resource: 'vendedores',
  routeBase: '/vendedores',
  featureKey: 'vendedores',
  listTitleKey: 'people.sellers.title',
  listTitle: 'Vendedores',
  listDescriptionKey: 'people.sellers.listDescription',
  listDescription: 'Listagem fiel ao legado com filtros por documento, tipo, bloqueio e situacao.',
  formTitleKey: 'people.sellers.formTitle',
  formTitle: 'Vendedor',
  breadcrumbSectionKey: 'routes.people',
  breadcrumbSection: 'People',
  breadcrumbModuleKey: 'people.sellers.title',
  breadcrumbModule: 'Vendedores',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'nome',
    sort: 'asc',
    id: '',
    codigo: '',
    tipo_vendedor: '',
    cnpj_cpf: '',
    'nome::like': '',
    bloqueado: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', sortKey: 'codigo', thClassName: 'w-[130px]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'tipo_vendedor',
      labelKey: 'people.sellers.fields.sellerType',
      label: 'Seller type',
      sortKey: 'tipo_vendedor',
      thClassName: 'w-[130px]',
      render: (record) => formatTipoVendedor(record.tipo_vendedor),
      filter: {
        kind: 'select',
        key: 'tipo_vendedor',
        labelKey: 'people.sellers.fields.sellerType',
        label: 'Seller type',
        options: [
          { value: 'ativo', label: 'Ativo' },
          { value: 'externo', label: 'Externo' },
          { value: 'receptivo', label: 'Receptivo' },
        ],
      },
    },
    {
      id: 'cnpj_cpf',
      labelKey: 'people.sellers.fields.document',
      label: 'CPF/CNPJ',
      sortKey: 'cnpj_cpf',
      thClassName: 'w-[160px]',
      render: (record) => formatCpfCnpj(record.cnpj_cpf),
      filter: { kind: 'text', key: 'cnpj_cpf', labelKey: 'people.sellers.fields.document', label: 'CPF/CNPJ' },
    },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Name',
      sortKey: 'nome',
      tdClassName: 'font-semibold text-slate-950',
      filter: { kind: 'text', key: 'nome::like' },
    },
    {
      id: 'bloqueado',
      labelKey: 'people.sellers.fields.blocked',
      label: 'Blocked',
      sortKey: 'bloqueado',
      thClassName: 'w-[110px]',
      valueKey: 'bloqueado',
      filter: { kind: 'select', key: 'bloqueado', labelKey: 'people.sellers.fields.blocked', label: 'Blocked', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Active',
      sortKey: 'ativo',
      thClassName: 'w-[100px]',
      valueKey: 'ativo',
      filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => formatCpfCnpj(record.cnpj_cpf),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  details: [
    { key: 'codigo_ativacao', labelKey: 'people.sellers.fields.activationCode', label: 'Activation code', render: (record) => String(record.codigo_ativacao || '-') },
    { key: 'tipo_vendedor', labelKey: 'people.sellers.fields.sellerType', label: 'Seller type', render: (record) => formatTipoVendedor(record.tipo_vendedor) },
    { key: 'email', labelKey: 'simpleCrud.fields.email', label: 'E-mail', render: (record) => String(record.email || '-') },
    { key: 'limite_credito', labelKey: 'people.sellers.fields.creditLimit', label: 'Credit limit', render: (record) => {
      const value = Number(record.limite_credito || 0)
      return value ? formatCurrency(value) : '-'
    } },
  ],
  sections: [],
  normalizeRecord: (record: CrudRecord) => {
    const ativoValue = record['ativo'] as unknown
    const bloqueadoValue = record['bloqueado'] as unknown
    return {
      ...record,
      ativo: ativoValue === true || ativoValue === 1 || ativoValue === '1',
      bloqueado: bloqueadoValue === true || bloqueadoValue === 1 || bloqueadoValue === '1',
    }
  },
}
