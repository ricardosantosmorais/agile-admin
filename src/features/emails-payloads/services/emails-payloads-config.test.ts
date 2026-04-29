import { describe, expect, it } from 'vitest'
import { EMAILS_PAYLOADS_CONFIG } from '@/src/features/emails-payloads/services/emails-payloads-config'
import { EMAIL_PAYLOAD_TYPE_OPTIONS } from '@/src/features/emails-payloads/services/emails-payloads-options'

describe('emails payloads config', () => {
  it('keeps the legacy list and form contract', () => {
    expect(EMAILS_PAYLOADS_CONFIG.resource).toBe('emails_payloads')
    expect(EMAILS_PAYLOADS_CONFIG.routeBase).toBe('/cadastros/emails-payloads')
    expect(EMAILS_PAYLOADS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'titulo', 'tipo', 'ativo'])
    expect(EMAILS_PAYLOADS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'titulo', 'tipo', 'payload'])
    expect(EMAIL_PAYLOAD_TYPE_OPTIONS.map((option) => option.value)).toContain('pedido_faturado')
  })
})
