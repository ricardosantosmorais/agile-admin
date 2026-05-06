import { asArray, asRecord, asString } from '@/src/lib/api-payload'

type LogisticaFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export const integracaoLogisticaParameterKeys = [
  'link_rastreamento',
  'frenet_token',
  'frenet_token_parceiro',
  'frenet_ambiente',
  'frenet_nota_fiscal',
  'mandae_versao',
  'mandae_token',
  'freterapido_cnpj',
  'freterapido_token',
  'freterapido_plataforma',
  'freterapido_canal',
  'freterapido_consolidar',
  'freterapido_sobrepor',
  'freterapido_tombar',
  'setcanhoto_token',
  'findcep_endpoint',
  'findcep_referer',
  'iboltt_company_id',
  'iboltt_token',
  'iboltt_status',
] as const

export const integracaoLogisticaEncryptedKeys = [
  'frenet_token',
  'frenet_token_parceiro',
  'mandae_token',
  'freterapido_token',
  'setcanhoto_token',
  'iboltt_token',
] as const satisfies readonly IntegracaoLogisticaFieldKey[]

export const integracaoLogisticaBooleanKeys = [
  'frenet_nota_fiscal',
  'freterapido_consolidar',
  'freterapido_sobrepor',
  'freterapido_tombar',
] as const satisfies readonly IntegracaoLogisticaFieldKey[]

export type IntegracaoLogisticaFieldKey = typeof integracaoLogisticaParameterKeys[number]
export type IntegracaoLogisticaEncryptedKey = typeof integracaoLogisticaEncryptedKeys[number]
export type IntegracaoLogisticaValues = Record<IntegracaoLogisticaFieldKey, string>

export type IntegracaoLogisticaBranch = {
  id: string
  name: string
}

export type IntegracaoLogisticaBranchValues = Record<string, {
  companyId: string
  token: string
}>

export type IntegracaoLogisticaBranchMetadata = Record<string, {
  companyId: LogisticaFieldMeta
  token: LogisticaFieldMeta
}>

export type IntegracaoLogisticaRecord = {
  values: IntegracaoLogisticaValues
  metadata: Record<IntegracaoLogisticaFieldKey, LogisticaFieldMeta>
  branches: IntegracaoLogisticaBranch[]
  branchValues: IntegracaoLogisticaBranchValues
  branchMetadata: IntegracaoLogisticaBranchMetadata
}

export type IntegracaoLogisticaParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: LogisticaFieldMeta = {
  updatedAt: '',
  updatedBy: '',
}

const encryptedKeySet = new Set<IntegracaoLogisticaFieldKey>(integracaoLogisticaEncryptedKeys)

function resolveTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function createEmptyValues(): IntegracaoLogisticaValues {
  const booleanKeys = new Set<IntegracaoLogisticaFieldKey>(integracaoLogisticaBooleanKeys)
  return integracaoLogisticaParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = key === 'frenet_ambiente' ? 'homologacao' : booleanKeys.has(key) ? '0' : ''
    return accumulator
  }, {} as IntegracaoLogisticaValues)
}

function createEmptyMetadata(): Record<IntegracaoLogisticaFieldKey, LogisticaFieldMeta> {
  return integracaoLogisticaParameterKeys.reduce((accumulator, key) => {
    accumulator[key] = { ...EMPTY_META }
    return accumulator
  }, {} as Record<IntegracaoLogisticaFieldKey, LogisticaFieldMeta>)
}

function extractFieldMeta(record: Record<string, unknown> | null): LogisticaFieldMeta {
  if (!record) {
    return { ...EMPTY_META }
  }

  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string, branchId?: string) {
  return parameters.find((item) => {
    const itemBranchId = asString(item.id_filial).trim()
    return asString(item.chave).trim() === key && (branchId ? itemBranchId === branchId : itemBranchId.length === 0)
  }) ?? null
}

function normalizeBranches(payload: unknown): IntegracaoLogisticaBranch[] {
  return asArray(asRecord(payload).data)
    .map((item) => {
      const record = asRecord(item)
      return {
        id: asString(record.id).trim(),
        name: asString(record.nome_fantasia).trim() || asString(record.nome).trim() || asString(record.razao_social).trim(),
      }
    })
    .filter((branch) => branch.id.length > 0)
}

export function createEmptyIntegracaoLogisticaRecord(): IntegracaoLogisticaRecord {
  return {
    values: createEmptyValues(),
    metadata: createEmptyMetadata(),
    branches: [],
    branchValues: {},
    branchMetadata: {},
  }
}

export function normalizeIntegracaoLogisticaRecord(payload: unknown): IntegracaoLogisticaRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))
  const branches = normalizeBranches(root.branches)
  const record = createEmptyIntegracaoLogisticaRecord()
  record.branches = branches

  for (const key of integracaoLogisticaParameterKeys) {
    if (key === 'iboltt_company_id' || key === 'iboltt_token') {
      continue
    }

    const parameter = getParameterByKey(parameters, key)
    record.values[key] = asString(parameter?.parametros).trim()
    record.metadata[key] = extractFieldMeta(parameter)
  }

  record.values.frenet_ambiente ||= 'homologacao'

  for (const branch of branches) {
    const companyId = getParameterByKey(parameters, 'iboltt_company_id', branch.id)
    const token = getParameterByKey(parameters, 'iboltt_token', branch.id)
    record.branchValues[branch.id] = {
      companyId: asString(companyId?.parametros).trim(),
      token: asString(token?.parametros).trim(),
    }
    record.branchMetadata[branch.id] = {
      companyId: extractFieldMeta(companyId),
      token: extractFieldMeta(token),
    }
  }

  return record
}

export function isIntegracaoLogisticaEncryptedKey(key: IntegracaoLogisticaFieldKey) {
  return encryptedKeySet.has(key)
}

export function buildIntegracaoLogisticaSavePayload(
  values: IntegracaoLogisticaValues,
  branchValues: IntegracaoLogisticaBranchValues,
  options?: { includeEncryptedKeys?: string[] },
): IntegracaoLogisticaParameterPayload[] {
  const includeEncryptedKeys = new Set(options?.includeEncryptedKeys ?? integracaoLogisticaEncryptedKeys)
  const payload: IntegracaoLogisticaParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: resolveTimestamp(), integracao: 0, criptografado: 0 },
  ]

  for (const key of integracaoLogisticaParameterKeys) {
    if (key === 'iboltt_company_id' || key === 'iboltt_token') {
      continue
    }

    if (encryptedKeySet.has(key) && !includeEncryptedKeys.has(key)) {
      continue
    }

    const value = values[key].trim()
    payload.push({
      id_filial: null,
      chave: key,
      parametros: value,
      integracao: 0,
      criptografado: encryptedKeySet.has(key) && value.length > 0 ? 1 : 0,
    })
  }

  for (const [branchId, branch] of Object.entries(branchValues)) {
    payload.push({
      id_filial: branchId,
      chave: 'iboltt_company_id',
      parametros: branch.companyId.trim(),
      integracao: 0,
      criptografado: 0,
    })

    const tokenKey = `iboltt_token__${branchId}`
    if (includeEncryptedKeys.has(tokenKey) || includeEncryptedKeys.has('iboltt_token')) {
      const token = branch.token.trim()
      payload.push({
        id_filial: branchId,
        chave: 'iboltt_token',
        parametros: token,
        integracao: 0,
        criptografado: token.length > 0 ? 1 : 0,
      })
    }
  }

  return payload
}
