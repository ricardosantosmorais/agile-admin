import type { CrudRecord } from '@/src/components/crud-base/types'
import { asBoolean, asString } from '@/src/lib/api-payload'
import { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'

export { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'

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
