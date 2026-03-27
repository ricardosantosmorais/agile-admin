'use client'

import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { toLookupOption } from '@/src/lib/lookup-options'
import { formatPriceStockDecimal, parsePriceStockDecimal, TRIBUTOS_PARTILHA_CALCULATION_META } from '@/src/features/precos-estoques/services/precos-estoques-shared'

export const TRIBUTOS_PARTILHA_CONFIG: CrudModuleConfig = {
  key: 'tributos-partilha',
  resource: 'tributos_partilha',
  routeBase: '/tributos-partilha',
  featureKey: 'tributosPartilha',
  listTitleKey: 'priceStock.taxesSharing.title',
  listTitle: 'Tributos x Partilha',
  listDescriptionKey: 'priceStock.taxesSharing.listDescription',
  listDescription: 'Listagem com produto, tipo de cálculo, UF e status ativo.',
  formTitleKey: 'priceStock.taxesSharing.formTitle',
  formTitle: 'Tributo x Partilha',
  breadcrumbSectionKey: 'routes.precosEstoques',
  breadcrumbSection: 'Preços e Estoques',
  breadcrumbModuleKey: 'routes.tributosPartilha',
  breadcrumbModule: 'Tributos x Partilha',
  listEmbed: 'produto',
  formEmbed: 'produto',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'desc',
    id: '',
    id_produto: '',
    uf: '',
    tipo_calculo: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    {
      id: 'id_produto',
      labelKey: 'priceStock.taxesSharing.fields.product',
      label: 'Produto',
      sortKey: 'id_produto',
      tdClassName: 'font-semibold text-slate-950',
      render: (record) => String((record.produto as { nome?: unknown } | null)?.nome || record.id_produto || '-'),
      filter: {
        kind: 'lookup',
        key: 'id_produto',
        loadOptions: (query, page, perPage) => loadCrudLookupOptions('produtos', query, page, perPage).then((items) => items.map((item) => ({ id: item.value, label: item.label }))),
      },
    },
    {
      id: 'tipo_calculo',
      labelKey: 'priceStock.taxesSharing.fields.calculationType',
      label: 'Tipo cálculo',
      sortKey: 'tipo_calculo',
      render: (record) => <StatusBadge tone="info">{TRIBUTOS_PARTILHA_CALCULATION_META[String(record.tipo_calculo || '') as keyof typeof TRIBUTOS_PARTILHA_CALCULATION_META] || String(record.tipo_calculo || '-')}</StatusBadge>,
      filter: { kind: 'select', key: 'tipo_calculo', options: [{ value: 'base_dupla_por_dentro', label: 'Base dupla por dentro' }, { value: 'base_dupla_por_fora', label: 'Base dupla por fora' }, { value: 'base_diferenca', label: 'Base diferença' }, { value: 'base_unica', label: 'Base única' }] },
    },
    { id: 'uf', labelKey: 'priceStock.taxesSharing.fields.state', label: 'UF', sortKey: 'uf', thClassName: 'w-[100px]', filter: { kind: 'select', key: 'uf', options: BRAZILIAN_STATES.map((value) => ({ value, label: value })) } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String((record.produto as { nome?: unknown } | null)?.nome || '-'),
  mobileSubtitle: (record) => TRIBUTOS_PARTILHA_CALCULATION_META[String(record.tipo_calculo || '') as keyof typeof TRIBUTOS_PARTILHA_CALCULATION_META] || String(record.tipo_calculo || '-'),
  mobileMeta: (record) => `UF: ${String(record.uf || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'priceStock.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'id_filial', labelKey: 'priceStock.taxesSharing.fields.branch', label: 'Filial', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_lookup' },
        { key: 'id_produto', labelKey: 'priceStock.taxesSharing.fields.product', label: 'Produto', type: 'lookup', optionsResource: 'produtos', lookupStateKey: 'id_produto_lookup' },
        { key: 'uf', labelKey: 'priceStock.taxesSharing.fields.state', label: 'UF', type: 'select', options: BRAZILIAN_STATES.map((value) => ({ value, label: value })) },
        {
          key: 'tipo_calculo',
          labelKey: 'priceStock.taxesSharing.fields.calculationType',
          label: 'Tipo cálculo',
          type: 'select',
          options: [
            { value: '', labelKey: 'common.select', label: 'Selecione' },
            { value: 'base_dupla_por_dentro', labelKey: 'priceStock.taxesSharing.options.doubleInside', label: 'Base dupla por dentro' },
            { value: 'base_dupla_por_fora', labelKey: 'priceStock.taxesSharing.options.doubleOutside', label: 'Base dupla por fora' },
            { value: 'base_diferenca', labelKey: 'priceStock.taxesSharing.options.differenceBase', label: 'Base diferença' },
            { value: 'base_unica', labelKey: 'priceStock.taxesSharing.options.singleBase', label: 'Base única' },
          ],
        },
      ],
    },
    {
      id: 'rates',
      titleKey: 'priceStock.taxesSharing.sections.rates',
      title: 'Alíquotas',
      layout: 'rows',
      fields: [
        { key: 'icms_interno', labelKey: 'priceStock.taxesSharing.fields.icmsInternal', label: 'ICMS interno', type: 'text', mask: 'decimal', suffixText: '%' },
        { key: 'icms_externo', labelKey: 'priceStock.taxesSharing.fields.icmsExternal', label: 'ICMS externo', type: 'text', mask: 'decimal', suffixText: '%' },
        { key: 'reducao_base', labelKey: 'priceStock.taxesSharing.fields.baseReduction', label: 'Redução base', type: 'text', mask: 'decimal', suffixText: '%' },
        { key: 'fecoep', labelKey: 'priceStock.taxesSharing.fields.fecoep', label: 'FECOEP', type: 'text', mask: 'decimal', suffixText: '%' },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => ({
    ...record,
    id_filial_lookup: toLookupOption(record.filial, ['nome_fantasia', 'nome'], record.id_filial),
    id_produto_lookup: toLookupOption(record.produto, ['nome'], record.id_produto),
    icms_interno: formatPriceStockDecimal(record.icms_interno, 4),
    icms_externo: formatPriceStockDecimal(record.icms_externo, 4),
    reducao_base: formatPriceStockDecimal(record.reducao_base, 4),
    fecoep: formatPriceStockDecimal(record.fecoep, 4),
  }),
  beforeSave: (record: CrudRecord) => ({
    ...record,
    id_filial: String((record.id_filial_lookup as { id?: unknown } | null)?.id || record.id_filial || '').trim() || null,
    id_produto: String((record.id_produto_lookup as { id?: unknown } | null)?.id || record.id_produto || '').trim() || null,
    icms_interno: parsePriceStockDecimal(record.icms_interno),
    icms_externo: parsePriceStockDecimal(record.icms_externo),
    reducao_base: parsePriceStockDecimal(record.reducao_base),
    fecoep: parsePriceStockDecimal(record.fecoep),
    id_sync: undefined,
    metadata: undefined,
    id_filial_lookup: undefined,
    id_produto_lookup: undefined,
  }),
}
