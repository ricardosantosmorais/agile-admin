import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { parseCurrencyInput } from '@/src/lib/input-masks'
import { toLookupOption } from '@/src/lib/lookup-options'
import { normalizeCurrencyInputValue, parseInteger } from '@/src/lib/value-parsers'

export const LIMITES_CREDITO_CONFIG: CrudModuleConfig = {
  key: 'limites-credito',
  resource: 'limites_credito',
  routeBase: '/limites-de-credito',
  featureKey: 'limitesCredito',
  listTitleKey: 'financial.creditLimits.title',
  listTitle: 'Limites de crédito',
  listDescriptionKey: 'financial.creditLimits.listDescription',
  listDescription: 'Listagem com forma de entrega, nome e status ativo.',
  formTitleKey: 'financial.creditLimits.formTitle',
  formTitle: 'Limite de crédito',
  breadcrumbSectionKey: 'routes.financeiro',
  breadcrumbSection: 'Financeiro',
  breadcrumbModuleKey: 'routes.limitesCredito',
  breadcrumbModule: 'Limites de Crédito',
  listEmbed: 'forma_entrega',
  formEmbed: 'forma_entrega',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'codigo::like': '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo::like' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
    {
      id: 'id_forma_entrega',
      labelKey: 'financial.creditLimits.fields.deliveryMethod',
      label: 'Forma de entrega',
      sortKey: 'id_forma_entrega',
      render: (record) => String((record.forma_entrega as { nome?: unknown } | null)?.nome || '-'),
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String((record.forma_entrega as { nome?: unknown } | null)?.nome || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'financial.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'id_forma_entrega', labelKey: 'financial.creditLimits.fields.deliveryMethod', label: 'Forma de entrega', type: 'lookup', optionsResource: 'formas_entrega', lookupStateKey: 'id_forma_entrega_lookup' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      ],
    },
    {
      id: 'credit-card',
      titleKey: 'financial.sections.creditCard',
      title: 'Cartão de crédito',
      layout: 'rows',
      fields: [
        { key: 'valor_pedido_cc', labelKey: 'financial.creditLimits.fields.orderValue', label: 'Valor do pedido', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'pedidos_dia_cc', labelKey: 'financial.creditLimits.fields.ordersPerDay', label: 'Pedidos por dia', type: 'number' },
        { key: 'valor_dia_cc', labelKey: 'financial.creditLimits.fields.valuePerDay', label: 'Valor por dia', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'pedidos_mes_cc', labelKey: 'financial.creditLimits.fields.ordersPerMonth', label: 'Pedidos por mês', type: 'number' },
        { key: 'valor_mes_cc', labelKey: 'financial.creditLimits.fields.valuePerMonth', label: 'Valor por mês', type: 'text', mask: 'currency', prefixText: 'R$' },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => ({
    ...record,
    id_forma_entrega_lookup: toLookupOption(record.forma_entrega, ['nome'], record.id_forma_entrega),
    valor_pedido_cc: normalizeCurrencyInputValue(record.valor_pedido_cc),
    valor_dia_cc: normalizeCurrencyInputValue(record.valor_dia_cc),
    valor_mes_cc: normalizeCurrencyInputValue(record.valor_mes_cc),
  }),
  beforeSave: (record: CrudRecord) => ({
    ...record,
    id_forma_entrega: String((record.id_forma_entrega_lookup as { id?: unknown } | null)?.id || record.id_forma_entrega || '').trim() || null,
    valor_pedido_cc: parseCurrencyInput(String(record.valor_pedido_cc || '')),
    pedidos_dia_cc: parseInteger(record.pedidos_dia_cc),
    valor_dia_cc: parseCurrencyInput(String(record.valor_dia_cc || '')),
    pedidos_mes_cc: parseInteger(record.pedidos_mes_cc),
    valor_mes_cc: parseCurrencyInput(String(record.valor_mes_cc || '')),
    id_forma_entrega_lookup: undefined,
  }),
}
