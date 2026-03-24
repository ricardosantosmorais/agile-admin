import { describe, expect, it } from 'vitest'
import {
  formatApiDateToInput,
  formatInputDateToApiEnd,
  formatInputDateToApiStart,
  formatMoneyInput,
  getCouponAvailabilityStatus,
  getCouponTypeLabel,
  getCouponValueLabel,
  normalizeCupomDescontoRecord,
  parseMoneyValue,
  toCupomDescontoPayload,
} from '@/src/features/cupons-desconto/services/cupons-desconto-mappers'

describe('cupons-desconto-mappers', () => {
  it('normalizes api payload to form fields', () => {
    const record = normalizeCupomDescontoRecord({
      ativo: 1,
      primeiro_pedido: 1,
      uso_unico: 0,
      app: 1,
      prazo_medio: 0,
      aplica_automatico: 1,
      tipo: 'percentual',
      valor: 15.5,
      valor_maximo: 30,
      pedido_minimo: 100,
      pedido_maximo: 500,
      data_inicio: '2026-03-20 00:00:00',
      data_fim: '2026-03-31 23:59:59',
      forma_pagamento: { id: '10', nome: 'Pix' },
      condicao_pagamento: { id: '20', nome: 'À vista' },
    })

    expect(record.ativo).toBe(true)
    expect(record.primeiro_pedido).toBe(true)
    expect(record.uso_unico).toBe(false)
    expect(record.percentual).toBe('15,50')
    expect(record.valor_maximo).toBe('30,00')
    expect(record.data_inicio).toBe('2026-03-20')
    expect(record.id_forma_pagamento).toBe('10')
    expect(record.id_condicao_pagamento_lookup).toEqual({ id: '20', label: 'À vista' })
  })

  it('builds write payload with normalized numbers, booleans and dates', () => {
    const payload = toCupomDescontoPayload({
      id: '',
      ativo: true,
      primeiro_pedido: true,
      uso_unico: false,
      app: true,
      prazo_medio: false,
      aplica_automatico: true,
      codigo: ' PROMO15 ',
      codigo_erp: '',
      nome: '',
      tipo: 'valor_fixo',
      percentual: '',
      valor_fixo: '25,90',
      perfil: 'cliente',
      uso_promocao: '2',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-31',
      valor_maximo: '',
      pedido_minimo: '100,00',
      pedido_maximo: '',
      limite_usos: '',
      itens_distintos: '3',
      prazo_medio_pagamento: '',
      id_forma_pagamento: '10',
      id_condicao_pagamento: '',
      usos: '5',
    })

    expect(payload.id).toBeUndefined()
    expect(payload.codigo).toBe('PROMO15')
    expect(payload.codigo_erp).toBeNull()
    expect(payload.nome).toBe('')
    expect(payload.valor).toBe(25.9)
    expect(payload.aplica_automatico).toBe(false)
    expect(payload.uso_promocao).toBe(0)
    expect(payload.data_inicio).toBe('2026-03-20 00:00:00')
    expect(payload.data_fim).toBe('2026-03-31 23:59:59')
    expect(payload.pedido_minimo).toBe(100)
    expect(payload.limite_usos).toBe(0)
    expect(payload.itens_distintos).toBe(3)
    expect(payload.usos).toBeUndefined()
  })

  it('clears payment condition when average payment term is informed', () => {
    const payload = toCupomDescontoPayload({
      tipo: 'percentual',
      percentual: '10,00',
      perfil: 'todos',
      uso_promocao: '1',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-31',
      prazo_medio_pagamento: '15',
      id_condicao_pagamento: '22',
    })

    expect(payload.prazo_medio_pagamento).toBe(15)
    expect(payload.id_condicao_pagamento).toBeNull()
  })

  it('formats and parses decimal and date helpers consistently', () => {
    expect(parseMoneyValue('1.234,56')).toBe(1234.56)
    expect(formatMoneyInput(1234.56)).toBe('1.234,56')
    expect(formatApiDateToInput('2026-03-20 10:00:00')).toBe('2026-03-20')
    expect(formatInputDateToApiStart('2026-03-20')).toBe('2026-03-20 00:00:00')
    expect(formatInputDateToApiEnd('2026-03-20')).toBe('2026-03-20 23:59:59')
  })

  it('derives labels and availability from coupon data', () => {
    expect(getCouponTypeLabel('frete_gratis')).toBe('Frete grátis')
    expect(getCouponValueLabel({ tipo: 'valor_fixo', valor: 19.9 })).toBe('R$ 19,90')

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    expect(getCouponAvailabilityStatus({ data_inicio: `${yesterday} 00:00:00`, data_fim: `${tomorrow} 23:59:59` })).toBe('available')
    expect(getCouponAvailabilityStatus({ data_inicio: `${tomorrow} 00:00:00`, data_fim: `${tomorrow} 23:59:59` })).toBe('upcoming')
    expect(getCouponAvailabilityStatus({ data_inicio: `${yesterday} 00:00:00`, data_fim: `${yesterday} 23:59:59` })).toBe('expired')
  })
})
