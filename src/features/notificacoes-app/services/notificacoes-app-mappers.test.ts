import { describe, expect, it } from 'vitest'
import { formatApiDateTimeToInput, formatInputDateTimeToApi, normalizeNotificacaoRecord, toNotificacaoPayload } from '@/src/features/notificacoes-app/services/notificacoes-app-mappers'

describe('notificacoes-app-mappers', () => {
  it('normalizes API values for the form state', () => {
    const record = normalizeNotificacaoRecord({
      titulo: 'App',
      mensagem: 'Mensagem',
      ativo: 1,
      enviado: '1',
      data_envio: '2026-03-24 10:30:00',
    })

    expect(record.ativo).toBe(true)
    expect(record.enviado).toBe(true)
    expect(record.data_envio).toBe('2026-03-24T10:30')
  })

  it('builds the write payload using the API datetime format', () => {
    const payload = toNotificacaoPayload({
      titulo: ' Aviso ',
      mensagem: ' Texto ',
      link: '',
      ativo: true,
      data_envio: '2026-03-24T10:30',
    })

    expect(payload.titulo).toBe('Aviso')
    expect(payload.mensagem).toBe('Texto')
    expect(payload.link).toBeNull()
    expect(payload.data_envio).toBe('2026-03-24 10:30:00')
  })

  it('keeps invalid input datetimes nullable', () => {
    expect(formatApiDateTimeToInput('')).toBe('')
    expect(formatInputDateTimeToApi('invalido')).toBeNull()
  })
})
