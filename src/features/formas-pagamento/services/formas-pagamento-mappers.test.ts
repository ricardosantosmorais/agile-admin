import { describe, expect, it } from 'vitest'
import { FORMAS_PAGAMENTO_CONFIG } from '@/src/features/formas-pagamento/services/formas-pagamento-config'
import { formatFormaPagamentoOccurrenceLabel, getFormaPagamentoTipoLabel } from '@/src/features/formas-pagamento/services/formas-pagamento-mappers'

describe('formas pagamento mappers', () => {
  it('serializes payload and forces manual internalization for pix', () => {
    const payload = FORMAS_PAGAMENTO_CONFIG.beforeSave?.({
      tipo: 'pix',
      codigo: ' FP-1 ',
      nome: ' PIX ',
      parcela_minima: '12,34',
      valor_taxas: '1,50',
      posicao: '4',
      ordem: '9',
      internaliza_auto: true,
    } as unknown as Record<string, unknown>)

    expect(payload).toMatchObject({
      codigo: 'FP-1',
      nome: 'PIX',
      parcela_minima: 12.34,
      valor_taxas: 1.5,
      posicao: 4,
      ordem: 9,
      internaliza_auto: false,
    })
  })

  it('formats occurrence and type labels', () => {
    expect(getFormaPagamentoTipoLabel('boleto_faturado')).toBe('Boleto faturado')
    expect(formatFormaPagamentoOccurrenceLabel({
      id: '1',
      id_forma_pagamento: '2',
      ocorrencia: 'tipo_cliente',
      id_objeto: 'R',
    })).toBe('Revenda')
  })
})
