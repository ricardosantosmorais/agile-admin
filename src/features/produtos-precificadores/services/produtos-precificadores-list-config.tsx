import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudListRecord } from '@/src/components/crud-base/types'
import {
  PRODUTO_PRECIFICADOR_ORIGIN_OPTIONS,
  PRODUTO_PRECIFICADOR_TYPE_OPTIONS,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-meta'

export const PRODUTOS_PRECIFICADORES_LIST_CONFIG = {
  key: 'produtos-precificadores',
  resource: 'produtos_precificadores',
  featureKey: 'produtosPrecificadores',
  routeBase: '/produtos-x-precificadores',
  listTitleKey: 'priceStock.productPricers.title',
  listTitle: 'Produtos x Precificadores',
  listDescriptionKey: 'priceStock.productPricers.description',
  listDescription: 'Listagem principal de regras de precificação por produto.',
  formTitleKey: 'priceStock.productPricers.formTitleCreate',
  formTitle: 'Precificador',
  breadcrumbSectionKey: 'routes.precosEstoques',
  breadcrumbSection: 'Preços e Estoques',
  breadcrumbModuleKey: 'routes.produtosPrecificadores',
  breadcrumbModule: 'Produtos x Precificadores',
  sections: [],
  mobileTitle: (record: CrudListRecord) => String(record.nome || '-'),
  mobileSubtitle: (record: CrudListRecord) => String(record.tipo || '-'),
  mobileMeta: (record: CrudListRecord) => String(record.origem || '-'),
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'created_at',
    sort: 'desc' as const,
    id: '',
    nome: '',
    tipo: '',
    origem: '',
    incluirDependentes: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'common.id', label: 'ID', sortKey: 'created_at', tdClassName: 'font-medium text-sm text-[color:var(--app-muted)]', filter: { kind: 'text', key: 'id' } },
    { id: 'nome', labelKey: 'common.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome' } },
    {
      id: 'tipo',
      labelKey: 'priceStock.productPricers.fields.type',
      label: 'Tipo',
      sortKey: 'tipo',
      filter: { kind: 'select', key: 'tipo', options: PRODUTO_PRECIFICADOR_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label })) },
    },
    {
      id: 'origem',
      labelKey: 'priceStock.productPricers.fields.origin',
      label: 'Origem',
      sortKey: 'origem',
      filter: { kind: 'select', key: 'origem', options: PRODUTO_PRECIFICADOR_ORIGIN_OPTIONS.map((item) => ({ value: item.value, label: item.label })) },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      render: (record: CrudListRecord) => {
        const active = record.ativo === true || record.ativo === 1 || record.ativo === '1'
        return <StatusBadge tone={active ? 'success' : 'neutral'}>{active ? 'Sim' : 'Não'}</StatusBadge>
      },
      filter: {
        kind: 'select',
        key: 'ativo',
        options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }],
      },
    },
  ],
} as const
