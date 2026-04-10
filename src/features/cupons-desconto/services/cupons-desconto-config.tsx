import { StatusBadge } from '@/src/components/ui/status-badge'
import { FormField } from '@/src/components/ui/form-field'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { currencyMask } from '@/src/lib/input-masks'
import {
  getCouponAvailabilityStatus,
  normalizeCupomDescontoRecord,
  parseMoneyValue,
  toCupomDescontoPayload,
} from '@/src/features/cupons-desconto/services/cupons-desconto-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

function hiddenUnless(type: string) {
  return ({ form }: { form: CrudRecord }) => String(form.tipo || '') !== type
}

function hasUses(record: CrudRecord) {
  const value = Number(String(record.usos || '0'))
  return Number.isFinite(value) && value > 0
}

function hasAverageTermPayment(record: CrudRecord) {
  return String(record.prazo_medio_pagamento || '').trim().length > 0
}

function translateCouponType(type: unknown, t: ReturnType<typeof useI18n>['t']) {
  switch (String(type || '')) {
    case 'percentual':
      return t('marketing.coupons.options.type.percentage', 'Percentage')
    case 'frete_gratis':
      return t('marketing.coupons.options.type.freeShipping', 'Free shipping')
    case 'valor_fixo':
      return t('marketing.coupons.options.type.fixedValue', 'Fixed value')
    default:
      return '-'
  }
}

function formatCouponValue(record: CrudRecord, t: ReturnType<typeof useI18n>['t']) {
  if (String(record.tipo || '') === 'frete_gratis') {
    return t('marketing.coupons.options.type.freeShipping', 'Free shipping')
  }

  const rawValue = typeof record.valor === 'number' ? record.valor : parseMoneyValue(record.valor)
  if (rawValue === null) {
    return '-'
  }

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rawValue)

  if (String(record.tipo || '') === 'percentual') {
    return `${formattedValue}%`
  }

  return `R$ ${formattedValue}`
}

function CouponTypeText({ type }: { type: unknown }) {
  const { t } = useI18n()
  return <>{translateCouponType(type, t)}</>
}

function CouponValueText({ record }: { record: CrudRecord }) {
  const { t } = useI18n()
  return <>{formatCouponValue(record, t)}</>
}

function CouponAvailabilityBadge({ record }: { record: CrudRecord }) {
  const { t } = useI18n()
  const status = String(record.disponivel || getCouponAvailabilityStatus(record))

  if (status === 'expired') {
    return <StatusBadge tone="danger">{t('marketing.coupons.options.availability.expired', 'Expired')}</StatusBadge>
  }

  if (status === 'upcoming') {
    return <StatusBadge tone="warning">{t('marketing.coupons.options.availability.upcoming', 'Upcoming')}</StatusBadge>
  }

  return <StatusBadge tone="success">{t('marketing.coupons.options.availability.available', 'Available')}</StatusBadge>
}

function CouponValueRangeFilter({
  draft,
  patchDraft,
}: {
  draft: Record<string, string | number>
  patchDraft: <K extends string>(key: K, value: Record<string, string | number>[K]) => void
}) {
  const { t } = useI18n()

  return (
    <FormField label={t('marketing.coupons.fields.value', 'Valor')}>
      <div className="grid gap-2 sm:grid-cols-2">
        <InputWithAffix
          type="text"
          prefix="R$"
          value={String(draft['valor::ge'] || '')}
          onChange={(event) => patchDraft('valor::ge', currencyMask(event.target.value))}
          inputMode="decimal"
          placeholder={t('common.from', 'From')}
        />
        <InputWithAffix
          type="text"
          prefix="R$"
          value={String(draft['valor::le'] || '')}
          onChange={(event) => patchDraft('valor::le', currencyMask(event.target.value))}
          inputMode="decimal"
          placeholder={t('common.to', 'To')}
        />
      </div>
    </FormField>
  )
}

export const CUPONS_DESCONTO_CONFIG: CrudModuleConfig = {
  key: 'cupons-desconto',
  resource: 'cupons_desconto',
  routeBase: '/cupons-desconto',
  featureKey: 'cuponsDesconto',
  listTitleKey: 'simpleCrud.modules.cuponsDesconto.title',
  listTitle: 'Cupons Desconto',
  listDescriptionKey: 'simpleCrud.modules.cuponsDesconto.listDescription',
  listDescription: 'Listagem com código, tipo, valor, usos, status ativo e disponibilidade.',
  formTitleKey: 'simpleCrud.modules.cuponsDesconto.formTitle',
  formTitle: 'Cupom Desconto',
  breadcrumbSectionKey: 'menuKeys.promocoes',
  breadcrumbSection: 'Promoções',
  breadcrumbModuleKey: 'menuKeys.cupons-desconto',
  breadcrumbModule: 'Cupons Desconto',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'desc',
    id: '',
    'codigo::like': '',
    tipo: '',
    'valor::ge': '',
    'valor::le': '',
    'usos::ge': '',
    'usos::le': '',
    ativo: '',
    disponivel: '',
    'data_inicio::ge': '',
    'data_fim::le': '',
  },
  extraFilters: [
    {
      kind: 'date-range',
      labelKey: 'common.period',
      label: 'Período',
      fromKey: 'data_inicio::ge',
      toKey: 'data_fim::le',
      widthClassName: 'md:col-span-2',
    },
  ],
  columns: [
    {
      id: 'id',
      labelKey: 'simpleCrud.fields.id',
      label: 'ID',
      sortKey: 'id',
      thClassName: 'w-[130px]',
      filter: { kind: 'text', key: 'id', inputMode: 'numeric' },
    },
    {
      id: 'codigo',
      labelKey: 'simpleCrud.fields.code',
      label: 'Código',
      sortKey: 'codigo',
      tdClassName: 'font-semibold text-slate-950',
      filter: { kind: 'text', key: 'codigo::like' },
    },
    {
      id: 'tipo',
      labelKey: 'marketing.coupons.fields.type',
      label: 'Tipo de cupom',
      sortKey: 'tipo',
      render: (record) => <CouponTypeText type={record.tipo} />,
      filter: {
        kind: 'select',
        key: 'tipo',
        options: [
          { value: 'percentual', labelKey: 'marketing.coupons.options.type.percentage', label: 'Percentage' },
          { value: 'frete_gratis', labelKey: 'marketing.coupons.options.type.freeShipping', label: 'Free shipping' },
          { value: 'valor_fixo', labelKey: 'marketing.coupons.options.type.fixedValue', label: 'Fixed value' },
        ],
      },
    },
    {
      id: 'valor',
      labelKey: 'marketing.coupons.fields.value',
      label: 'Valor',
      thClassName: 'w-[180px]',
      render: (record) => <CouponValueText record={record} />,
      filter: {
        kind: 'custom',
        render: ({ draft, patchDraft }) => <CouponValueRangeFilter draft={draft} patchDraft={patchDraft} />,
      },
    },
    {
      id: 'usos',
      labelKey: 'marketing.coupons.fields.uses',
      label: 'Usos',
      sortKey: 'usos',
      thClassName: 'w-[140px]',
      tdClassName: 'text-right',
      filter: { kind: 'number-range', fromKey: 'usos::ge', toKey: 'usos::le', inputMode: 'numeric' },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      valueKey: 'ativo',
      filter: {
        kind: 'select',
        key: 'ativo',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Yes' },
          { value: '0', labelKey: 'common.no', label: 'No' },
        ],
      },
    },
    {
      id: 'disponivel',
      labelKey: 'marketing.coupons.fields.availability',
      label: 'Disponibilidade',
      render: (record) => <CouponAvailabilityBadge record={record} />,
      filter: {
        kind: 'select',
        key: 'disponivel',
        options: [
          { value: '1', labelKey: 'marketing.coupons.options.availability.available', label: 'Available' },
          { value: '0', labelKey: 'marketing.coupons.options.availability.expired', label: 'Expired' },
          { value: '2', labelKey: 'marketing.coupons.options.availability.upcoming', label: 'Upcoming' },
        ],
      },
    },
  ],
  mobileTitle: (record) => String(record.codigo || '-'),
  mobileSubtitle: (record) => <CouponTypeText type={record.tipo} />,
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'simpleCrud.sections.main',
      title: 'Dados principais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'primeiro_pedido', labelKey: 'marketing.coupons.fields.firstOrder', label: 'Primeiro pedido', type: 'toggle', helperTextKey: 'marketing.coupons.helpers.firstOrder' },
        { key: 'uso_unico', labelKey: 'marketing.coupons.fields.singleUse', label: 'Uso único', type: 'toggle', helperTextKey: 'marketing.coupons.helpers.singleUse' },
        { key: 'app', labelKey: 'marketing.coupons.fields.appOnly', label: 'Exclusivo app', type: 'toggle', helperTextKey: 'marketing.coupons.helpers.appOnly' },
        { key: 'prazo_medio', labelKey: 'marketing.coupons.fields.averageTerm', label: 'Considera prazo médio', type: 'toggle', helperTextKey: 'marketing.coupons.helpers.averageTerm' },
        {
          key: 'aplica_automatico',
          labelKey: 'marketing.coupons.fields.automaticApply',
          label: 'Aplicação automática',
          type: 'toggle',
          helperTextKey: 'marketing.coupons.helpers.automaticApply',
          disabled: ({ form }) => String(form.tipo || '') !== 'percentual',
        },
        {
          key: 'codigo',
          labelKey: 'simpleCrud.fields.code',
          label: 'Código',
          type: 'text',
          required: true,
          helperTextKey: 'marketing.coupons.helpers.code',
          layoutClassName: 'max-w-[320px]',
          maxLength: 32,
          disabled: ({ form }) => hasUses(form),
        },
        {
          key: 'codigo_erp',
          labelKey: 'marketing.coupons.fields.erpCode',
          label: 'Código ERP',
          type: 'text',
          helperTextKey: 'marketing.coupons.helpers.erpCode',
          layoutClassName: 'max-w-[320px]',
          maxLength: 32,
        },
        {
          key: 'tipo',
          labelKey: 'marketing.coupons.fields.type',
          label: 'Tipo de cupom',
          type: 'select',
          required: true,
          helperTextKey: 'marketing.coupons.helpers.type',
          options: [
            { value: 'percentual', labelKey: 'marketing.coupons.options.type.percentage', label: 'Percentual' },
            { value: 'frete_gratis', labelKey: 'marketing.coupons.options.type.freeShipping', label: 'Frete grátis' },
            { value: 'valor_fixo', labelKey: 'marketing.coupons.options.type.fixedValue', label: 'Valor fixo' },
          ],
          layoutClassName: 'max-w-[320px]',
          disabled: ({ form }) => hasUses(form),
        },
        {
          key: 'percentual',
          labelKey: 'marketing.coupons.fields.value',
          label: 'Valor',
          type: 'text',
          mask: 'decimal',
          suffixText: '%',
          hidden: hiddenUnless('percentual'),
          helperTextKey: 'marketing.coupons.helpers.percentage',
          layoutClassName: 'max-w-[220px]',
          disabled: ({ form }) => hasUses(form),
        },
        {
          key: 'valor_fixo',
          labelKey: 'marketing.coupons.fields.value',
          label: 'Valor',
          type: 'text',
          mask: 'currency',
          prefixText: 'R$',
          hidden: hiddenUnless('valor_fixo'),
          helperTextKey: 'marketing.coupons.helpers.fixedValue',
          layoutClassName: 'max-w-[220px]',
          disabled: ({ form }) => hasUses(form),
        },
        {
          key: 'nome',
          labelKey: 'marketing.coupons.fields.description',
          label: 'Descrição',
          type: 'text',
          helperTextKey: 'marketing.coupons.helpers.description',
          layoutClassName: 'max-w-[720px]',
          maxLength: 255,
        },
        {
          key: 'perfil',
          labelKey: 'simpleCrud.fields.profile',
          label: 'Perfil de usuário',
          type: 'select',
          required: true,
          helperTextKey: 'marketing.coupons.helpers.profile',
          options: [
            { value: 'todos', labelKey: 'simpleCrud.profile.all', label: 'Todos' },
            { value: 'cliente', labelKey: 'simpleCrud.profile.customer', label: 'Cliente' },
            { value: 'vendedor', labelKey: 'simpleCrud.profile.seller', label: 'Vendedor' },
          ],
          layoutClassName: 'max-w-[320px]',
        },
        {
          key: 'uso_promocao',
          labelKey: 'marketing.coupons.fields.promotionUsage',
          label: 'Aplica em promoções',
          type: 'select',
          helperTextKey: 'marketing.coupons.helpers.promotionUsage',
          options: [
            { value: '0', labelKey: 'marketing.coupons.options.promotionUsage.no', label: 'Não' },
            { value: '1', labelKey: 'marketing.coupons.options.promotionUsage.yes', label: 'Sim' },
            { value: '2', labelKey: 'marketing.coupons.options.promotionUsage.bestDiscount', label: 'Maior desconto' },
          ],
          layoutClassName: 'max-w-[320px]',
        },
        {
          key: 'data_inicio',
          labelKey: 'marketing.coupons.fields.startDate',
          label: 'Data início',
          type: 'date',
          required: true,
          helperTextKey: 'marketing.coupons.helpers.startDate',
          layoutClassName: 'max-w-[260px]',
        },
        {
          key: 'data_fim',
          labelKey: 'marketing.coupons.fields.endDate',
          label: 'Data fim',
          type: 'date',
          required: true,
          helperTextKey: 'marketing.coupons.helpers.endDate',
          layoutClassName: 'max-w-[260px]',
        },
        {
          key: 'valor_maximo',
          labelKey: 'marketing.coupons.fields.maximumValue',
          label: 'Valor máximo',
          type: 'text',
          mask: 'currency',
          prefixText: 'R$',
          hidden: hiddenUnless('percentual'),
          helperTextKey: 'marketing.coupons.helpers.maximumValue',
          layoutClassName: 'max-w-[220px]',
        },
        {
          key: 'pedido_minimo',
          labelKey: 'marketing.coupons.fields.minimumOrder',
          label: 'Pedido mínimo',
          type: 'text',
          mask: 'currency',
          prefixText: 'R$',
          helperTextKey: 'marketing.coupons.helpers.minimumOrder',
          layoutClassName: 'max-w-[220px]',
        },
        {
          key: 'pedido_maximo',
          labelKey: 'marketing.coupons.fields.maximumOrder',
          label: 'Pedido máximo',
          type: 'text',
          mask: 'currency',
          prefixText: 'R$',
          helperTextKey: 'marketing.coupons.helpers.maximumOrder',
          layoutClassName: 'max-w-[220px]',
        },
        {
          key: 'usos',
          labelKey: 'marketing.coupons.fields.uses',
          label: 'Usos',
          type: 'number',
          helperTextKey: 'marketing.coupons.helpers.uses',
          layoutClassName: 'max-w-[220px]',
          disabled: true,
        },
        {
          key: 'limite_usos',
          labelKey: 'marketing.coupons.fields.usageLimit',
          label: 'Limite de usos',
          type: 'number',
          helperTextKey: 'marketing.coupons.helpers.usageLimit',
          layoutClassName: 'max-w-[220px]',
          inputMode: 'numeric',
        },
        {
          key: 'itens_distintos',
          labelKey: 'marketing.coupons.fields.distinctItems',
          label: 'Itens distintos',
          type: 'number',
          helperTextKey: 'marketing.coupons.helpers.distinctItems',
          layoutClassName: 'max-w-[220px]',
          inputMode: 'numeric',
        },
        {
          key: 'prazo_medio_pagamento',
          labelKey: 'marketing.coupons.fields.averageTermPayment',
          label: 'Prazo médio',
          type: 'number',
          helperTextKey: 'marketing.coupons.helpers.averageTermPayment',
          layoutClassName: 'max-w-[220px]',
          inputMode: 'numeric',
        },
        {
          key: 'id_forma_pagamento',
          labelKey: 'marketing.coupons.fields.paymentMethod',
          label: 'Forma de pagamento',
          type: 'lookup',
          optionsResource: 'formas_pagamento',
          lookupStateKey: 'id_forma_pagamento_lookup',
          helperTextKey: 'marketing.coupons.helpers.paymentMethod',
          layoutClassName: 'max-w-[520px]',
        },
        {
          key: 'id_condicao_pagamento',
          labelKey: 'marketing.coupons.fields.paymentCondition',
          label: 'Condição de pagamento',
          type: 'lookup',
          optionsResource: 'condicoes_pagamento',
          lookupStateKey: 'id_condicao_pagamento_lookup',
          helperTextKey: 'marketing.coupons.helpers.paymentCondition',
          layoutClassName: 'max-w-[520px]',
          hidden: ({ form }) => hasAverageTermPayment(form),
        },
      ],
    },
  ],
  formEmbed: 'forma_pagamento,condicao_pagamento',
  normalizeRecord: (record: CrudRecord) => normalizeCupomDescontoRecord(record),
  beforeSave: (record: CrudRecord) => toCupomDescontoPayload(record),
  getSaveRedirectPath: ({ isEditing, saved, form }) => {
    if (isEditing) {
      return '/cupons-desconto'
    }

    const savedId = String(saved[0]?.id || form.id || '')
    return savedId ? `/cupons-desconto/${savedId}/editar` : '/cupons-desconto'
  },
}
