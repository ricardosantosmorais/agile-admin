import type { CrudRecord } from '@/src/components/crud-base/types'

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function formatApiDateTimeToInput(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return ''
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/)
  return match ? `${match[1]}T${match[2]}:${match[3]}` : ''
}

export function formatInputDateTimeToApi(value: unknown) {
  const normalized = asString(value).trim()
  if (!normalized) {
    return null
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/)
  return match ? `${match[1]} ${match[2]}:${match[3]}:00` : null
}

export function normalizeNotificacaoRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    titulo: asString(record.titulo),
    mensagem: asString(record.mensagem),
    link: asString(record.link),
    ativo: asBoolean(record.ativo),
    enviado: asBoolean(record.enviado),
    data_envio: formatApiDateTimeToInput(record.data_envio),
  }
}

export function toNotificacaoPayload(record: CrudRecord): CrudRecord {
  return {
    ...record,
    titulo: asString(record.titulo).trim(),
    mensagem: asString(record.mensagem).trim(),
    link: asString(record.link).trim() || null,
    ativo: asBoolean(record.ativo),
    data_envio: formatInputDateTimeToApi(record.data_envio),
  }
}
