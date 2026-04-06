import type {
  ConfiguracoesEntregasFieldDefinition,
  ConfiguracoesEntregasFieldKey,
  ConfiguracoesEntregasFormValues,
  ConfiguracoesEntregasOption,
  ConfiguracoesEntregasRecord,
} from '@/src/features/configuracoes-entregas/types/configuracoes-entregas'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

const yesNoOptions = [
  { value: '1', labelKey: 'common.yes', fallbackLabel: 'Sim' },
  { value: '0', labelKey: 'common.no', fallbackLabel: 'Não' },
] as const

const addressOptions = [
  { value: 'PF', labelKey: 'configuracoes.delivery.options.pf', fallbackLabel: 'Apenas pessoa física' },
  { value: 'PJ', labelKey: 'configuracoes.delivery.options.pj', fallbackLabel: 'Apenas pessoa jurídica' },
  { value: 'PF,PJ', labelKey: 'configuracoes.delivery.options.pfPj', fallbackLabel: 'Pessoa física e pessoa jurídica' },
  { value: 'ISENTO', labelKey: 'configuracoes.delivery.options.exempt', fallbackLabel: 'Cliente isento' },
] as const

export const configuracoesEntregasFieldDefinitions: ConfiguracoesEntregasFieldDefinition[] = [
  { key: 'aplica_frete_tributos', section: 'freight', type: 'boolean', options: [...yesNoOptions] },
  { key: 'calcula_frete', section: 'freight', type: 'boolean', options: [...yesNoOptions] },
  { key: 'divide_frete', section: 'freight', type: 'boolean', options: [...yesNoOptions] },
  {
    key: 'cobra_frete_unico',
    section: 'freight',
    type: 'enum',
    includeEmptyOption: false,
    options: [
      { value: '', labelKey: 'common.no', fallbackLabel: 'Não' },
      { value: 'maior', labelKey: 'configuracoes.delivery.options.highestFreight', fallbackLabel: 'Maior' },
      { value: 'menor', labelKey: 'configuracoes.delivery.options.lowestFreight', fallbackLabel: 'Menor' },
    ],
  },
  {
    key: 'rateio_frete_produtos',
    section: 'freight',
    type: 'enum',
    options: [
      { value: 'I', labelKey: 'configuracoes.delivery.options.initialPrice', fallbackLabel: 'Preço inicial' },
      { value: 'V', labelKey: 'configuracoes.delivery.options.salePrice', fallbackLabel: 'Preço de venda' },
    ],
  },
  { key: 'frete_unico', section: 'freight', type: 'boolean', options: [...yesNoOptions] },
  { key: 'frete_unico_multi_encomenda', section: 'freight', type: 'boolean', options: [...yesNoOptions] },
  { key: 'id_forma_entrega_padrao', section: 'checkout', type: 'enum', options: [] },
  { key: 'informa_cep', section: 'checkout', type: 'boolean', options: [...yesNoOptions] },
  { key: 'informa_endereco', section: 'checkout', type: 'enum', options: [...addressOptions] },
  { key: 'multi_encomenda', section: 'split', type: 'boolean', options: [...yesNoOptions] },
  { key: 'multi_endereco', section: 'split', type: 'boolean', options: [...yesNoOptions] },
  { key: 'pessoa_retirada', section: 'split', type: 'boolean', options: [...yesNoOptions] },
]
export const configuracoesEntregasParameterKeys = configuracoesEntregasFieldDefinitions.map((field) => field.key)

export function createEmptyConfiguracoesEntregasForm(): ConfiguracoesEntregasFormValues {
  return configuracoesEntregasFieldDefinitions.reduce((accumulator, field) => {
    accumulator[field.key] = ''
    return accumulator
  }, {} as ConfiguracoesEntregasFormValues)
}

function normalizeDeliveryMethods(payload: unknown): ConfiguracoesEntregasOption[] {
  const rows = asArray(asRecord(payload).data)

  return rows.map((item) => {
    const method = asRecord(item)
    const id = toStringValue(method.id)
    const name = toStringValue(method.nome)
    return {
      value: id,
      fallbackLabel: name ? `${name} - ${id}` : id,
    }
  }).filter((item) => item.value)
}

export function normalizeConfiguracoesEntregasRecord(payload: unknown): ConfiguracoesEntregasRecord {
  const record = asRecord(payload)
  const parameterRows = asArray(asRecord(record.parameters).data)
  const values = createEmptyConfiguracoesEntregasForm()
  const metadata: ConfiguracoesEntregasRecord['metadata'] = {}

  for (const item of parameterRows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesEntregasFieldKey
    if (!(key in values)) {
      continue
    }

    values[key] = toStringValue(parameter.parametros)

    const updatedAt = toStringValue(parameter.created_at)
    const updatedBy = toStringValue(asRecord(parameter.usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[key] = { updatedAt, updatedBy }
    }
  }

  return {
    values,
    metadata,
    deliveryMethods: normalizeDeliveryMethods(record.deliveryMethods),
  }
}

export function buildDirtyConfiguracoesEntregasPayload(
  initialValues: ConfiguracoesEntregasFormValues,
  currentValues: ConfiguracoesEntregasFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = configuracoesEntregasFieldDefinitions.filter((field) => {
    const initialValue = String(initialValues[field.key] ?? '').trim()
    const currentValue = String(currentValues[field.key] ?? '').trim()
    return initialValue !== currentValue
  })

  if (!changedFields.length) {
    return []
  }

  return [
    { id_filial: null, chave: 'versao', parametros: version },
    ...changedFields.map((field) => ({
      id_filial: null,
      chave: field.key,
      parametros: String(currentValues[field.key] ?? '').trim(),
    })),
  ]
}


