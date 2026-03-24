'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { formatNullableCurrency } from '@/src/lib/formatters'
import { parseCurrencyInput } from '@/src/lib/input-masks'

function normalizeDecimal(value: unknown, precision = 2) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return ''
  }

  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

export const SEGMENTOS_CLIENTES_CONFIG: CrudModuleConfig = {
  key: 'segmentos-clientes',
  resource: 'segmentos',
  routeBase: '/segmentos-clientes',
  featureKey: 'segmentosClientes',
  listTitleKey: 'people.customerSegments.title',
  listTitle: 'Segmentos de clientes',
  listDescriptionKey: 'people.customerSegments.listDescription',
  listDescription: 'Listagem server-side com pedido mínimo, peso mínimo e situação.',
  formTitleKey: 'people.customerSegments.formTitle',
  formTitle: 'Segmento de clientes',
  breadcrumbSectionKey: 'routes.people',
  breadcrumbSection: 'Pessoas',
  breadcrumbModuleKey: 'people.customerSegments.title',
  breadcrumbModule: 'Segmentos de clientes',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', 'pedido_minimo::ge': '', 'pedido_minimo::le': '', 'peso_minimo::ge': '', 'peso_minimo::le': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'pedido_minimo', labelKey: 'people.customerSegments.fields.minimumOrder', label: 'Pedido mínimo', sortKey: 'pedido_minimo', render: (record) => formatNullableCurrency(record.pedido_minimo as string | number | null | undefined), filter: { kind: 'number-range', fromKey: 'pedido_minimo::ge', toKey: 'pedido_minimo::le', labelKey: 'people.customerSegments.fields.minimumOrder', label: 'Pedido mínimo', inputMode: 'decimal' } },
    { id: 'peso_minimo', labelKey: 'people.customerSegments.fields.minimumWeight', label: 'Peso mínimo', sortKey: 'peso_minimo', render: (record) => record.peso_minimo ? `${normalizeDecimal(record.peso_minimo as string | number | null | undefined, 3)} kg` : '-', filter: { kind: 'number-range', fromKey: 'peso_minimo::ge', toKey: 'peso_minimo::le', labelKey: 'people.customerSegments.fields.minimumWeight', label: 'Peso mínimo', inputMode: 'decimal' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => record.pedido_minimo ? formatNullableCurrency(record.pedido_minimo as string | number | null | undefined) : '',
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
        { key: 'pedido_minimo', labelKey: 'people.customerSegments.fields.minimumOrder', label: 'Pedido mínimo', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'peso_minimo', labelKey: 'people.customerSegments.fields.minimumWeight', label: 'Peso mínimo', type: 'text', mask: 'decimal', suffixText: 'kg' },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => ({
    id: String(record.id || ''),
    ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
    codigo: String(record.codigo || ''),
    nome: String(record.nome || ''),
    pedido_minimo: normalizeDecimal(record.pedido_minimo, 2),
    peso_minimo: normalizeDecimal(record.peso_minimo, 3),
  }),
  beforeSave: (record: CrudRecord) => ({
    id: String(record.id || '') || undefined,
    ativo: record.ativo === true,
    codigo: String(record.codigo || '') || null,
    nome: String(record.nome || '').trim(),
    pedido_minimo: parseCurrencyInput(String(record.pedido_minimo || '')),
    peso_minimo: parseCurrencyInput(String(record.peso_minimo || '')),
  }),
}
