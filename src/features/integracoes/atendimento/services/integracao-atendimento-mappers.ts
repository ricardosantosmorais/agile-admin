import { asArray, asRecord, asString } from '@/src/lib/api-payload'

type AtendimentoTabKey = 'whatsapp' | 'jivo' | 'ebit'

type AtendimentoFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type IntegracaoAtendimentoBranchRow = {
  id: string
  nome: string
  whatsappNumero: string
  whatsappIdNumero: string
  whatsappNumeroMeta: AtendimentoFieldMeta
}

export type IntegracaoAtendimentoValues = {
  whatsappExibicao: string
  whatsappGateway: string
  whatsappApiToken: string
  jivoJs: string
  ebitCodigo: string
}

export type IntegracaoAtendimentoRecord = {
  values: IntegracaoAtendimentoValues
  metadata: {
    whatsappExibicao: AtendimentoFieldMeta
    whatsappGateway: AtendimentoFieldMeta
    whatsappApiToken: AtendimentoFieldMeta
    jivoJs: AtendimentoFieldMeta
    ebitCodigo: AtendimentoFieldMeta
  }
  branches: IntegracaoAtendimentoBranchRow[]
}

export type IntegracaoAtendimentoParameterPayload = {
  id_filial: string | null
  chave: string
  parametros: string
  integracao: number
  criptografado: number
}

export const integracaoAtendimentoTabs: Array<{ key: AtendimentoTabKey; icon: 'message' | 'comment' | 'gem' }> = [
  { key: 'whatsapp', icon: 'message' },
  { key: 'jivo', icon: 'comment' },
  { key: 'ebit', icon: 'gem' },
]

const EMPTY_VALUES: IntegracaoAtendimentoValues = {
  whatsappExibicao: '',
  whatsappGateway: '',
  whatsappApiToken: '',
  jivoJs: '',
  ebitCodigo: '',
}

const EMPTY_META: AtendimentoFieldMeta = {
  updatedAt: '',
  updatedBy: '',
}

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

function getParameterByKey(parameters: Array<Record<string, unknown>>, key: string, branchId?: string) {
  return parameters.find((item) => {
    const itemKey = asString(item.chave).trim()
    const itemBranch = asString(item.id_filial).trim()
    if (itemKey !== key) {
      return false
    }

    if (!branchId) {
      return itemBranch.length === 0
    }

    return itemBranch === branchId
  }) ?? null
}

function extractFieldMeta(record: Record<string, unknown> | null): AtendimentoFieldMeta {
  if (!record) {
    return { ...EMPTY_META }
  }

  const user = asRecord(record.usuario)
  return {
    updatedAt: asString(record.created_at).trim(),
    updatedBy: asString(user.nome).trim(),
  }
}

export function createEmptyIntegracaoAtendimentoRecord(): IntegracaoAtendimentoRecord {
  return {
    values: { ...EMPTY_VALUES },
    metadata: {
      whatsappExibicao: { ...EMPTY_META },
      whatsappGateway: { ...EMPTY_META },
      whatsappApiToken: { ...EMPTY_META },
      jivoJs: { ...EMPTY_META },
      ebitCodigo: { ...EMPTY_META },
    },
    branches: [],
  }
}

export function normalizeIntegracaoAtendimentoRecord(payload: unknown): IntegracaoAtendimentoRecord {
  const root = asRecord(payload)
  const parametersPayload = asRecord(root.parameters)
  const branchesPayload = asRecord(root.branches)

  const parameters = asArray(parametersPayload.data).map((item) => asRecord(item))
  const branches = asArray(branchesPayload.data).map((item) => asRecord(item))

  const globalWhatsappDisplay = getParameterByKey(parameters, 'whatsapp_exibicao')
  const globalWhatsappGateway = getParameterByKey(parameters, 'whatsapp_gateway')
  const globalWhatsappApiToken = getParameterByKey(parameters, 'whatsapp_api_token')
  const jivoJs = getParameterByKey(parameters, 'jivo_js')
  const ebitCodigo = getParameterByKey(parameters, 'ebit_codigo')

  return {
    values: {
      whatsappExibicao: asString(globalWhatsappDisplay?.parametros).trim(),
      whatsappGateway: asString(globalWhatsappGateway?.parametros).trim(),
      whatsappApiToken: asString(globalWhatsappApiToken?.parametros).trim(),
      jivoJs: asString(jivoJs?.parametros).trim(),
      ebitCodigo: asString(ebitCodigo?.parametros).trim(),
    },
    metadata: {
      whatsappExibicao: extractFieldMeta(globalWhatsappDisplay),
      whatsappGateway: extractFieldMeta(globalWhatsappGateway),
      whatsappApiToken: extractFieldMeta(globalWhatsappApiToken),
      jivoJs: extractFieldMeta(jivoJs),
      ebitCodigo: extractFieldMeta(ebitCodigo),
    },
    branches: branches.map((branch) => {
      const branchId = asString(branch.id).trim()
      const whatsappNumber = getParameterByKey(parameters, 'whatsapp_numero', branchId)
      const whatsappNumberId = getParameterByKey(parameters, 'whatsapp_id_numero', branchId)

      return {
        id: branchId,
        nome: asString(branch.nome_fantasia).trim() || '-',
        whatsappNumero: asString(whatsappNumber?.parametros).trim(),
        whatsappIdNumero: asString(whatsappNumberId?.parametros).trim(),
        whatsappNumeroMeta: extractFieldMeta(whatsappNumber),
      }
    }),
  }
}

export function buildIntegracaoAtendimentoSavePayload(
  values: IntegracaoAtendimentoValues,
  branches: IntegracaoAtendimentoBranchRow[],
  options?: { includeWhatsappToken?: boolean },
): IntegracaoAtendimentoParameterPayload[] {
  const includeWhatsappToken = options?.includeWhatsappToken ?? true
  const version = resolveTimestamp()
  const payload: IntegracaoAtendimentoParameterPayload[] = [
    { id_filial: null, chave: 'versao', parametros: version, integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'whatsapp_exibicao', parametros: values.whatsappExibicao.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'whatsapp_gateway', parametros: values.whatsappGateway.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'jivo_js', parametros: values.jivoJs.trim(), integracao: 0, criptografado: 0 },
    { id_filial: null, chave: 'ebit_codigo', parametros: values.ebitCodigo.trim(), integracao: 0, criptografado: 0 },
  ]

  if (includeWhatsappToken) {
    payload.push({
      id_filial: null,
      chave: 'whatsapp_api_token',
      parametros: values.whatsappApiToken.trim(),
      integracao: 0,
      criptografado: values.whatsappApiToken.trim().length > 0 ? 1 : 0,
    })
  }

  for (const branch of branches) {
    payload.push(
      {
        id_filial: branch.id || null,
        chave: 'whatsapp_numero',
        parametros: branch.whatsappNumero.trim(),
        integracao: 0,
        criptografado: 0,
      },
      {
        id_filial: branch.id || null,
        chave: 'whatsapp_id_numero',
        parametros: branch.whatsappIdNumero.trim(),
        integracao: 0,
        criptografado: 0,
      },
    )
  }

  return payload
}
