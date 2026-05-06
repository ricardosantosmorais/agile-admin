import { asArray, asRecord, asString } from '@/src/lib/api-payload'

export type ClientesFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ClientesBranchRow = {
  id: string
  nome: string
  portalToken: string
  portalTokenMeta: ClientesFieldMeta
}

export type ClientesValues = {
  cnpjaToken: string
  croApiKey: string
  portalPedidos: string
  portalOrcamentos: string
  portalTitulos: string
  portalNotasFiscais: string
}

export type ClientesMetadata = {
  cnpjaToken: ClientesFieldMeta
  croApiKey: ClientesFieldMeta
  portalPedidos: ClientesFieldMeta
  portalOrcamentos: ClientesFieldMeta
  portalTitulos: ClientesFieldMeta
  portalNotasFiscais: ClientesFieldMeta
}

export type IntegracaoClientesRecord = {
  values: ClientesValues
  metadata: ClientesMetadata
  branches: ClientesBranchRow[]
}

export type ClientesParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

const EMPTY_META: ClientesFieldMeta = { updatedAt: '', updatedBy: '' }

const EMPTY_VALUES: ClientesValues = {
  cnpjaToken: '',
  croApiKey: '',
  portalPedidos: '',
  portalOrcamentos: '',
  portalTitulos: '',
  portalNotasFiscais: '',
}

function resolveTimestamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function getParameterByKey(
  parameters: Array<Record<string, unknown>>,
  key: string,
  branchId?: string,
) {
  return (
    parameters.find((item) => {
      const itemKey = asString(item.chave).trim()
      const itemBranch = asString(item.id_filial).trim()
      if (itemKey !== key) return false
      if (!branchId) return itemBranch.length === 0
      return itemBranch === branchId
    }) ?? null
  )
}

function extractFieldMeta(record: Record<string, unknown> | null): ClientesFieldMeta {
  if (!record) return { ...EMPTY_META }
  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoClientesRecord(): IntegracaoClientesRecord {
  return {
    values: { ...EMPTY_VALUES },
    metadata: {
      cnpjaToken: { ...EMPTY_META },
      croApiKey: { ...EMPTY_META },
      portalPedidos: { ...EMPTY_META },
      portalOrcamentos: { ...EMPTY_META },
      portalTitulos: { ...EMPTY_META },
      portalNotasFiscais: { ...EMPTY_META },
    },
    branches: [],
  }
}

export function normalizeIntegracaoClientesRecord(payload: unknown): IntegracaoClientesRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const branchesPayload = asRecord(root.branches)

  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))
  const branches = asArray(branchesPayload.data).map((item) => asRecord(item))

  const cnpjaToken = getParameterByKey(parameters, 'cnpja_token')
  const croApiKey = getParameterByKey(parameters, 'cro_apikey')
  const portalPedidos = getParameterByKey(parameters, 'portal_pedidos')
  const portalOrcamentos = getParameterByKey(parameters, 'portal_orcamentos')
  const portalTitulos = getParameterByKey(parameters, 'portal_titulos')
  const portalNotasFiscais = getParameterByKey(parameters, 'portal_notas_fiscais')

  return {
    values: {
      cnpjaToken: asString(cnpjaToken?.parametros).trim(),
      croApiKey: asString(croApiKey?.parametros).trim(),
      portalPedidos: asString(portalPedidos?.parametros).trim(),
      portalOrcamentos: asString(portalOrcamentos?.parametros).trim(),
      portalTitulos: asString(portalTitulos?.parametros).trim(),
      portalNotasFiscais: asString(portalNotasFiscais?.parametros).trim(),
    },
    metadata: {
      cnpjaToken: extractFieldMeta(cnpjaToken),
      croApiKey: extractFieldMeta(croApiKey),
      portalPedidos: extractFieldMeta(portalPedidos),
      portalOrcamentos: extractFieldMeta(portalOrcamentos),
      portalTitulos: extractFieldMeta(portalTitulos),
      portalNotasFiscais: extractFieldMeta(portalNotasFiscais),
    },
    branches: branches.map((branch) => {
      const branchId = asString(branch.id).trim()
      const portalToken = getParameterByKey(parameters, 'portal_token', branchId)
      return {
        id: branchId,
        nome: asString(branch.nome_fantasia).trim() || '-',
        portalToken: asString(portalToken?.parametros).trim(),
        portalTokenMeta: extractFieldMeta(portalToken),
      }
    }),
  }
}

export function buildIntegracaoClientesSavePayload(
  values: ClientesValues,
  branches: ClientesBranchRow[],
  options?: {
    includeCnpjaToken?: boolean
    includeCroApiKey?: boolean
    unlockedBranchIds?: Set<string>
  },
): ClientesParameterPayload[] {
  const version = resolveTimestamp()
  const includeCnpjaToken = options?.includeCnpjaToken ?? true
  const includeCroApiKey = options?.includeCroApiKey ?? true
  const unlockedBranchIds = options?.unlockedBranchIds ?? new Set<string>()

  const payload: ClientesParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: version, integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'portal_pedidos', parametros: values.portalPedidos.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'portal_orcamentos', parametros: values.portalOrcamentos.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'portal_titulos', parametros: values.portalTitulos.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'portal_notas_fiscais', parametros: values.portalNotasFiscais.trim(), integracao: 0, criptografado: 0 },
  ]

  if (includeCnpjaToken) {
    payload.push({
      id_filial: null,
      chave: 'cnpja_token',
      parametros: values.cnpjaToken.trim(),
      integracao: 0,
      criptografado: values.cnpjaToken.trim().length > 0 ? 1 : 0,
    })
  }

  if (includeCroApiKey) {
    payload.push({
      id_filial: null,
      chave: 'cro_apikey',
      parametros: values.croApiKey.trim(),
      integracao: 0,
      criptografado: values.croApiKey.trim().length > 0 ? 1 : 0,
    })
  }

  for (const branch of branches) {
    if (unlockedBranchIds.has(branch.id)) {
      payload.push({
        id_filial: branch.id || null,
        chave: 'portal_token',
        parametros: branch.portalToken.trim(),
        integracao: 0,
        criptografado: branch.portalToken.trim().length > 0 ? 1 : 0,
      })
    }
  }

  return payload
}
