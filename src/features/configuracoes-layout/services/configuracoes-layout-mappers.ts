import type {
  ConfiguracoesLayoutAreaDefinition,
  ConfiguracoesLayoutFieldKey,
  ConfiguracoesLayoutFormValues,
  ConfiguracoesLayoutRecord,
} from '@/src/features/configuracoes-layout/types/configuracoes-layout'

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

export const configuracoesLayoutAreaDefinitions: ConfiguracoesLayoutAreaDefinition[] = [
  { key: 'branding', fieldKeys: ['logomarca', 'ico'] },
  { key: 'theme', fieldKeys: ['css'] },
  { key: 'top', fieldKeys: ['barra-topo', 'barra-topo-mobile'], supportsViewport: true },
  { key: 'menu', fieldKeys: ['barra-menu', 'barra-menu-mobile'], supportsViewport: true },
  { key: 'newsletter', fieldKeys: ['barra-newsletter'] },
  { key: 'services', fieldKeys: ['barra-servicos'] },
  { key: 'footer', fieldKeys: ['barra-rodape'] },
  { key: 'seo', fieldKeys: ['meta_titulo', 'meta_palavras_chave', 'meta_descricao'] },
]

export const configuracoesLayoutTextUploadFields: Array<
  | 'css'
  | 'barra-topo'
  | 'barra-topo-mobile'
  | 'barra-menu'
  | 'barra-menu-mobile'
  | 'barra-newsletter'
  | 'barra-servicos'
  | 'barra-rodape'
> = [
  'css',
  'barra-topo',
  'barra-topo-mobile',
  'barra-menu',
  'barra-menu-mobile',
  'barra-newsletter',
  'barra-servicos',
  'barra-rodape',
]

export const configuracoesLayoutFieldKeys: ConfiguracoesLayoutFieldKey[] = [
  'logomarca',
  'ico',
  'css',
  'barra-topo',
  'barra-topo-mobile',
  'barra-menu',
  'barra-menu-mobile',
  'barra-newsletter',
  'barra-servicos',
  'barra-rodape',
  'meta_titulo',
  'meta_palavras_chave',
  'meta_descricao',
]

export function createEmptyConfiguracoesLayoutForm(): ConfiguracoesLayoutFormValues {
  return configuracoesLayoutFieldKeys.reduce((accumulator, key) => {
    accumulator[key] = ''
    return accumulator
  }, {} as ConfiguracoesLayoutFormValues)
}

export function normalizeConfiguracoesLayoutRecord(payload: unknown): ConfiguracoesLayoutRecord {
  const record = asRecord(payload)
  const parameterRows = asArray(asRecord(record.parameters).data)
  const company = asRecord(asArray(asRecord(record.company).data)[0])
  const values = createEmptyConfiguracoesLayoutForm()
  const metadata: ConfiguracoesLayoutRecord['metadata'] = {}

  for (const row of parameterRows) {
    const parameter = asRecord(row)
    const key = toStringValue(parameter.chave) as ConfiguracoesLayoutFieldKey
    if (!configuracoesLayoutFieldKeys.includes(key)) {
      continue
    }

    values[key] = toStringValue(parameter.parametros)

    const updatedAt = toStringValue(parameter.created_at)
    const updatedBy = toStringValue(asRecord(parameter.usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[key] = { updatedAt, updatedBy }
    }
  }

  if (!values.logomarca) {
    values.logomarca = toStringValue(company.logo)
  }

  if (!values.ico) {
    values.ico = toStringValue(company.ico)
  }

  return {
    values,
    metadata,
    company: {
      id: toStringValue(company.id),
      logo: toStringValue(company.logo),
      logoAlt: toStringValue(company.logo_alt),
      ico: toStringValue(company.ico),
      bucketUrl: toStringValue(company.s3_bucket),
    },
  }
}

export function getDirtyConfiguracoesLayoutKeys(
  initialValues: ConfiguracoesLayoutFormValues,
  currentValues: ConfiguracoesLayoutFormValues,
) {
  return configuracoesLayoutFieldKeys.filter((key) => {
    const initialValue = String(initialValues[key] ?? '').trim()
    const currentValue = String(currentValues[key] ?? '').trim()
    return initialValue !== currentValue
  })
}


