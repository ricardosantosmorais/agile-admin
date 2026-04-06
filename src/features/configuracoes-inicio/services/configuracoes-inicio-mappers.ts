import type {
  ConfiguracoesInicioFieldDefinition,
  ConfiguracoesInicioFieldKey,
  ConfiguracoesInicioFormValues,
  ConfiguracoesInicioOption,
  ConfiguracoesInicioRecord,
} from '@/src/features/configuracoes-inicio/types/configuracoes-inicio'

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

export const configuracoesInicioTipoPagamentoOptions: ConfiguracoesInicioOption[] = [
  { value: 'boleto_antecipado', fallbackLabel: 'Boleto antecipado' },
  { value: 'boleto_faturado', fallbackLabel: 'Boleto faturado' },
  { value: 'cartao_credito', fallbackLabel: 'Cartão de crédito' },
  { value: 'cartao_debito', fallbackLabel: 'Cartão de débito' },
  { value: 'cheque', fallbackLabel: 'Cheque' },
  { value: 'deposito_antecipado', fallbackLabel: 'Depósito antecipado' },
  { value: 'deposito_faturado', fallbackLabel: 'Depósito faturado' },
  { value: 'dinheiro', fallbackLabel: 'Dinheiro' },
  { value: 'pix', fallbackLabel: 'PIX' },
  { value: 'pos', fallbackLabel: 'POS' },
]

export const configuracoesInicioFieldDefinitions: ConfiguracoesInicioFieldDefinition[] = [
  { key: 'id_cliente_inicio', section: 'navigation', type: 'text', inputMode: 'numeric' },
  { key: 'id_filial_inicio', section: 'navigation', type: 'lookup', lookupCollection: 'branches', lookupResource: 'filiais' },
  { key: 'informa_cep_localizacao', section: 'navigation', type: 'enum', options: [...yesNoOptions] },
  { key: 'coluna_preco_inicio', section: 'pricing', type: 'text', inputMode: 'numeric' },
  { key: 'id_tabela_preco_inicio', section: 'pricing', type: 'lookup', lookupCollection: 'priceTables', lookupResource: 'tabelas_preco' },
  { key: 'desconto_pix', section: 'pricing', type: 'text', inputMode: 'decimal' },
  { key: 'id_forma_pagamento_inicio', section: 'payment', type: 'lookup', lookupCollection: 'paymentMethods', lookupResource: 'formas_pagamento' },
  { key: 'id_condicao_pagamento_inicio', section: 'payment', type: 'lookup', lookupCollection: 'paymentConditions', lookupResource: 'condicoes_pagamento' },
  { key: 'tipo_forma_pagamento_inicio', section: 'payment', type: 'enum', options: configuracoesInicioTipoPagamentoOptions },
]
export const configuracoesInicioParameterKeys = configuracoesInicioFieldDefinitions.map((field) => field.key)

export function createEmptyConfiguracoesInicioForm(): ConfiguracoesInicioFormValues {
  return configuracoesInicioFieldDefinitions.reduce((accumulator, field) => {
    accumulator[field.key] = ''
    return accumulator
  }, {} as ConfiguracoesInicioFormValues)
}

function normalizeLookupOptions(payload: unknown, labelKeys: string[]): ConfiguracoesInicioOption[] {
  return asArray(asRecord(payload).data)
    .map((item) => {
      const record = asRecord(item)
      const id = toStringValue(record.id)
      if (!id) {
        return null
      }

      const labelParts = labelKeys.map((key) => toStringValue(record[key])).filter(Boolean)

      return {
        value: id,
        fallbackLabel: labelParts.length ? `${labelParts.join(' - ')} - ${id}` : id,
      }
    })
    .filter((item): item is ConfiguracoesInicioOption => item !== null)
}

export function normalizeConfiguracoesInicioRecord(payload: unknown): ConfiguracoesInicioRecord {
  const record = asRecord(payload)
  const parameterRows = asArray(asRecord(record.parameters).data)
  const values = createEmptyConfiguracoesInicioForm()
  const metadata: ConfiguracoesInicioRecord['metadata'] = {}

  for (const item of parameterRows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesInicioFieldKey
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
    lookups: {
      branches: normalizeLookupOptions(record.branches, ['nome_fantasia']),
      paymentMethods: normalizeLookupOptions(record.paymentMethods, ['nome']),
      paymentConditions: normalizeLookupOptions(record.paymentConditions, ['nome']),
      priceTables: normalizeLookupOptions(record.priceTables, ['nome']),
    },
  }
}

export function buildDirtyConfiguracoesInicioPayload(
  initialValues: ConfiguracoesInicioFormValues,
  currentValues: ConfiguracoesInicioFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = configuracoesInicioFieldDefinitions.filter((field) => {
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


