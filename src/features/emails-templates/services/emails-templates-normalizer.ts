import type { CrudRecord } from '@/src/components/crud-base/types'

const BOOLEAN_FIELDS = [
  'ativo',
  'envia_empresa',
  'envia_filial',
  'envia_filial_estoque',
  'envia_filial_retira',
  'envia_usuario',
  'envia_cliente',
  'envia_contato',
  'envia_vendedor',
] as const

export function normalizeEmailTemplateRecord(record: CrudRecord): CrudRecord {
  const source = (
    Array.isArray(record.data)
    && record.data[0]
    && typeof record.data[0] === 'object'
  ) ? record.data[0] as CrudRecord : record

  const normalized: CrudRecord = { ...source }

  for (const key of BOOLEAN_FIELDS) {
    const value = normalized[key]
    normalized[key] = value === true || value === 1 || value === '1'
  }

  normalized.tempo_envio = Number.isFinite(Number(normalized.tempo_envio))
    ? Math.max(0, Number(normalized.tempo_envio))
    : 0

  if (!String(normalized.codigo || '').trim()) {
    normalized.codigo = null
  }

  if (!String(normalized.enviar_para || '').trim()) {
    normalized.enviar_para = null
  }

  normalized.tipo = String(normalized.tipo || '').trim() || null
  const modelo = String(normalized.modelo || '').trim().toLowerCase()
  normalized.modelo = modelo === 'php' ? 'php' : 'twig'
  const htmlCandidate = [
    normalized.html,
    normalized.template,
    normalized.conteudo,
    normalized.content,
    normalized.body,
    normalized.mensagem,
  ].find((value) => typeof value === 'string' && value.trim().length > 0)

  normalized.html = typeof htmlCandidate === 'string' ? htmlCandidate : ''

  return normalized
}
