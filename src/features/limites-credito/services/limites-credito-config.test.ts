import { describe, expect, it } from 'vitest'
import { LIMITES_CREDITO_CONFIG } from '@/src/features/limites-credito/services/limites-credito-config'

describe('limites credito config', () => {
  it('normalizes delivery method lookup and money fields for editing', () => {
    const record = LIMITES_CREDITO_CONFIG.normalizeRecord?.({
      id_forma_entrega: '2',
      forma_entrega: { id: '2', nome: 'Entrega expressa' },
      valor_pedido_cc: 1234.56,
      valor_dia_cc: 300,
      valor_mes_cc: 5000,
    })

    expect(record).toMatchObject({
      id_forma_entrega_lookup: { id: '2', label: 'Entrega expressa' },
      valor_pedido_cc: '1.234,56',
      valor_dia_cc: '300,00',
      valor_mes_cc: '5.000,00',
    })
  })

  it('serializes numeric payload to the API contract', () => {
    const payload = LIMITES_CREDITO_CONFIG.beforeSave?.({
      id_forma_entrega_lookup: { id: '2', label: 'Entrega expressa' },
      valor_pedido_cc: '1.234,56',
      pedidos_dia_cc: '4',
      valor_dia_cc: '300,00',
      pedidos_mes_cc: '20',
      valor_mes_cc: '5.000,00',
    })

    expect(payload).toMatchObject({
      id_forma_entrega: '2',
      valor_pedido_cc: 1234.56,
      pedidos_dia_cc: 4,
      valor_dia_cc: 300,
      pedidos_mes_cc: 20,
      valor_mes_cc: 5000,
    })
    expect(payload?.id_forma_entrega_lookup).toBeUndefined()
  })
})
