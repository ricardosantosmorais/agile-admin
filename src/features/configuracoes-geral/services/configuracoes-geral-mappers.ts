import type {
  ConfiguracoesGeralCompany,
  ConfiguracoesGeralFieldDefinition,
  ConfiguracoesGeralFormValues,
  ConfiguracoesGeralRecord,
} from '@/src/features/configuracoes-geral/types/configuracoes-geral'

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

function toNumberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseFixedListOptions(value: unknown) {
  const raw = toStringValue(value)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return asArray(parsed)
      .map((item) => {
        const option = asRecord(item)
        return {
          value: toStringValue(option.value),
          label: toStringValue(option.text || option.label || option.nome || option.value),
        }
      })
      .filter((option) => option.value || option.label)
  } catch {
    return []
  }
}

function resolveCompanyField(key: string): ConfiguracoesGeralFieldDefinition['companyField'] {
  if (key === 'modo_ecommerce') {
    return 'tipo'
  }

  if (key === 'url_site') {
    return 'url'
  }

  if (key === 'url_imagens') {
    return 's3_bucket'
  }

  return undefined
}

function normalizeFields(payload: unknown) {
  const normalized: ConfiguracoesGeralFieldDefinition[] = []

  for (const item of asArray(asRecord(payload).data)) {
    const field = asRecord(item)
    const key = toStringValue(field.chave)

    if (!key) {
      continue
    }

    const isFixedCombo =
      toStringValue(field.tipo_entrada) === 'combo'
      && toStringValue(field.fonte_dados) === 'lista_fixa'

    normalized.push({
      key,
      label: toStringValue(field.nome || key),
      description: toStringValue(field.descricao),
      type: isFixedCombo ? 'enum' : 'text',
      options: isFixedCombo ? parseFixedListOptions(field.dados) : [],
      order: toNumberValue(field.ordem),
      companyField: resolveCompanyField(key),
    })
  }

  return normalized.sort((left, right) => left.order - right.order)
}

function normalizeCompany(payload: unknown): ConfiguracoesGeralCompany {
  const rawCompany = asArray(asRecord(payload).data)[0]
  const company = asRecord(rawCompany)

  return {
    id: toStringValue(company.id),
    codigo: toStringValue(company.codigo || company.id),
    idTemplate: toStringValue(company.id_template),
  }
}

export function normalizeConfiguracoesGeralRecord(payload: unknown): ConfiguracoesGeralRecord {
  const record = asRecord(payload)
  const fields = normalizeFields(record.schema)
  const company = normalizeCompany(record.company)
  const companyData = asRecord(asArray(asRecord(record.company).data)[0])
  const parameterRows = asArray(asRecord(record.parameters).data)
  const metadata: Record<string, { updatedAt: string; updatedBy: string }> = {}
  const values: ConfiguracoesGeralFormValues = {}

  const parameterMap = new Map(
    parameterRows.map((item) => {
      const parameter = asRecord(item)
      return [toStringValue(parameter.chave), parameter] as const
    }),
  )

  for (const field of fields) {
    const parameter = parameterMap.get(field.key)
    const parameterValue = toStringValue(asRecord(parameter).parametros)
    const companyValue = field.companyField ? toStringValue(companyData[field.companyField]) : ''

    values[field.key] = parameterValue || companyValue

    const updatedAt = toStringValue(asRecord(parameter).created_at)
    const updatedBy = toStringValue(asRecord(asRecord(parameter).usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[field.key] = { updatedAt, updatedBy }
    }
  }

  return {
    fields,
    values,
    metadata,
    company,
  }
}

export function buildDirtyConfiguracoesGeralPayload(
  fields: ConfiguracoesGeralFieldDefinition[],
  initialValues: ConfiguracoesGeralFormValues,
  currentValues: ConfiguracoesGeralFormValues,
  companyId: string,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = fields.filter((field) => {
    const initialValue = String(initialValues[field.key] ?? '').trim()
    const currentValue = String(currentValues[field.key] ?? '').trim()
    return initialValue !== currentValue
  })

  if (!changedFields.length) {
    return {
      parameters: [] as Array<{ id_filial: null; chave: string; parametros: string }>,
      company: null as null | { id: string; tipo?: string; url?: string; s3_bucket?: string },
    }
  }

  const companyPayload: { id: string; tipo?: string; url?: string; s3_bucket?: string } = { id: companyId }

  for (const field of changedFields) {
    if (!field.companyField) {
      continue
    }

    const nextValue = String(currentValues[field.key] ?? '').trim()
    if (field.companyField === 's3_bucket' && nextValue && !/^https?:\/\//i.test(nextValue)) {
      companyPayload.s3_bucket = `https://${nextValue}`
      continue
    }

    companyPayload[field.companyField] = nextValue
  }

  const hasCompanyChanges = Object.keys(companyPayload).length > 1

  return {
    parameters: [
      { id_filial: null, chave: 'versao', parametros: version },
      ...changedFields.map((field) => ({
        id_filial: null,
        chave: field.key,
        parametros: String(currentValues[field.key] ?? '').trim(),
      })),
    ],
    company: hasCompanyChanges ? companyPayload : null,
  }
}

export function mapConfiguracoesGeralFieldsToBaseDefinitions(fields: ConfiguracoesGeralFieldDefinition[]) {
  return fields.map((field) => ({
    key: field.key,
    section: 'general',
    type: field.type,
    label: field.label,
    helper: field.description,
    options: field.options,
  }))
}


