import type {
  ConfiguracoesClientesFieldDefinition,
  ConfiguracoesClientesFieldKey,
  ConfiguracoesClientesFormValues,
  ConfiguracoesClientesRecord,
} from '@/src/features/configuracoes-clientes/types/configuracoes-clientes'

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

const customerTypeOptions = [
  { value: 'PF', labelKey: 'configuracoes.customers.options.pf', fallbackLabel: 'Apenas pessoa física' },
  { value: 'PJ', labelKey: 'configuracoes.customers.options.pj', fallbackLabel: 'Apenas pessoa jurídica' },
  { value: 'PF,PJ', labelKey: 'configuracoes.customers.options.pfPj', fallbackLabel: 'Pessoa física e pessoa jurídica' },
] as const

export const configuracoesClientesFieldDefinitions: ConfiguracoesClientesFieldDefinition[] = [
  { key: 'campos_ocultos_cadastro_cliente', section: 'registration', type: 'text' },
  {
    key: 'forma_ativacao_cliente',
    section: 'registration',
    type: 'enum',
    options: [
      { value: 'codigo', labelKey: 'configuracoes.customers.options.activationCode', fallbackLabel: 'Validação do código' },
      { value: 'email', labelKey: 'configuracoes.customers.options.activationEmail', fallbackLabel: 'Validação do e-mail' },
      { value: 'nenhum', labelKey: 'configuracoes.customers.options.activationNone', fallbackLabel: 'Sem validação' },
    ],
  },
  {
    key: 'informacao_inicial_cadastro',
    section: 'registration',
    type: 'enum',
    options: [
      { value: 'email', labelKey: 'configuracoes.customers.options.initialInfoEmail', fallbackLabel: 'E-mail (indicado para B2C)' },
      { value: 'cnpj_cpf', labelKey: 'configuracoes.customers.options.initialInfoDocument', fallbackLabel: 'CNPJ ou CPF (indicado para B2B)' },
    ],
  },
  { key: 'tipo_cliente_ativacao', section: 'registration', type: 'enum', options: [...customerTypeOptions] },
  { key: 'tipo_cliente', section: 'registration', type: 'enum', options: [...customerTypeOptions] },
  { key: 'tipo_cliente_login', section: 'registration', type: 'enum', options: [...customerTypeOptions] },
  { key: 'permite_cadastro_cliente', section: 'registration', type: 'enum', options: [...customerTypeOptions] },
  { key: 'tipo_ecommerce', section: 'registration', type: 'enum', options: [...customerTypeOptions] },
  {
    key: 'tipo_cliente_padrao',
    section: 'registration',
    type: 'enum',
    options: [
      { value: 'PF', labelKey: 'configuracoes.customers.options.defaultPf', fallbackLabel: 'Pessoa física' },
      { value: 'PJ', labelKey: 'configuracoes.customers.options.defaultPj', fallbackLabel: 'Pessoa jurídica' },
    ],
  },
  { key: 'ufs_cadastro_cliente', section: 'registration', type: 'text' },
  { key: 'informa_idade', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'qualquer_filial', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'seleciona_entrega', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'seleciona_filial', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'seleciona_pagamento', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'seleciona_preferencias', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'seleciona_regiao', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'seleciona_vendedor', section: 'experience', type: 'boolean', options: [...yesNoOptions] },
  { key: 'checa_limite_credito', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
  { key: 'exibe_limite', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
  { key: 'senha_forte', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
  { key: 'valida_cnae', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
  { key: 'valida_vendedor', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
  { key: 'vincula_tabela_preco', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
  { key: 'altera_carrinho_vendedor', section: 'rules', type: 'boolean', options: [...yesNoOptions] },
]
export const configuracoesClientesParameterKeys = configuracoesClientesFieldDefinitions.map((field) => field.key)

export function createEmptyConfiguracoesClientesForm(): ConfiguracoesClientesFormValues {
  return configuracoesClientesFieldDefinitions.reduce((accumulator, field) => {
    accumulator[field.key] = ''
    return accumulator
  }, {} as ConfiguracoesClientesFormValues)
}

export function normalizeConfiguracoesClientesRecord(payload: unknown): ConfiguracoesClientesRecord {
  const record = asRecord(payload)
  const rows = asArray(record.data)
  const values = createEmptyConfiguracoesClientesForm()
  const metadata: ConfiguracoesClientesRecord['metadata'] = {}

  for (const item of rows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesClientesFieldKey
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

  return { values, metadata }
}

export function buildConfiguracoesClientesPayload(
  values: ConfiguracoesClientesFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  return [
    { id_filial: null, chave: 'versao', parametros: version },
    ...configuracoesClientesFieldDefinitions.map((field) => ({
      id_filial: null,
      chave: field.key,
      parametros: String(values[field.key] ?? '').trim(),
    })),
  ]
}

export function buildDirtyConfiguracoesClientesPayload(
  initialValues: ConfiguracoesClientesFormValues,
  currentValues: ConfiguracoesClientesFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = configuracoesClientesFieldDefinitions.filter((field) => {
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


