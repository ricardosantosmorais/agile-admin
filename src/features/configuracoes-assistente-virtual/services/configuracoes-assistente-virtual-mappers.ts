import { asArray, asRecord, asString } from '@/src/lib/api-payload'
import type {
  ConfiguracoesAssistenteVirtualFieldKey,
  ConfiguracoesAssistenteVirtualFormValues,
  ConfiguracoesAssistenteVirtualRecord,
} from '@/src/features/configuracoes-assistente-virtual/types/configuracoes-assistente-virtual'

export const configuracoesAssistenteVirtualFieldKeys: ConfiguracoesAssistenteVirtualFieldKey[] = [
  'ia_ativo',
  'ia_nome',
  'ia_avatar',
  'ia_mensagem_mix_cliente',
  'ia_mensagem_mix_segmento',
  'ia_mensagem_alta_preco',
  'ia_mensagem_falta',
  'ia_mensagem_frequencia_compra',
  'ia_mensagem_recomendados',
]

function getParametroRecord(payload: unknown, key: ConfiguracoesAssistenteVirtualFieldKey) {
  const items = asArray(asRecord(payload).data)
  return items.find((item) => asString(asRecord(item).chave) === key)
}

export function createEmptyConfiguracoesAssistenteVirtualForm(): ConfiguracoesAssistenteVirtualFormValues {
  return {
    ia_ativo: '0',
    ia_nome: '',
    ia_avatar: '',
    ia_mensagem_mix_cliente: '',
    ia_mensagem_mix_segmento: '',
    ia_mensagem_alta_preco: '',
    ia_mensagem_falta: '',
    ia_mensagem_frequencia_compra: '',
    ia_mensagem_recomendados: '',
  }
}

export function normalizeConfiguracoesAssistenteVirtualRecord(payload: unknown): ConfiguracoesAssistenteVirtualRecord {
  const values = createEmptyConfiguracoesAssistenteVirtualForm()
  const metadata: ConfiguracoesAssistenteVirtualRecord['metadata'] = {}

  for (const key of configuracoesAssistenteVirtualFieldKeys) {
    const record = asRecord(getParametroRecord(payload, key))
    const userRecord = asRecord(record.usuario)
    values[key] = asString(record.parametros, values[key])

    const updatedAt = asString(record.created_at)
    const updatedBy = asString(userRecord.nome)
    if (updatedAt || updatedBy) {
      metadata[key] = {
        updatedAt,
        updatedBy,
      }
    }
  }

  return {
    values,
    metadata,
  }
}

export function buildDirtyConfiguracoesAssistenteVirtualPayload(
  initialValues: ConfiguracoesAssistenteVirtualFormValues,
  currentValues: ConfiguracoesAssistenteVirtualFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const dirtyFields = configuracoesAssistenteVirtualFieldKeys
    .filter((key) => String(initialValues[key] ?? '').trim() !== String(currentValues[key] ?? '').trim())
    .map((key) => ({
      id_filial: null,
      chave: key,
      parametros: String(currentValues[key] ?? '').trim(),
    }))

  if (!dirtyFields.length) {
    return []
  }

  return [
    { id_filial: null, chave: 'versao', parametros: version },
    ...dirtyFields,
  ]
}


