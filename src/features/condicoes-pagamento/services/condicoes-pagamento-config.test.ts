import { describe, expect, it } from 'vitest'
import { CONDICOES_PAGAMENTO_CONFIG } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-config'

describe('condicoes pagamento config', () => {
  it('normalizes numeric and currency fields for editing', () => {
    const record = CONDICOES_PAGAMENTO_CONFIG.normalizeRecord?.({
      parcelas: 3,
      prazo_medio: 28,
      pedido_minimo: 1234.56,
      desconto: 2.5,
    })

    expect(record).toMatchObject({
      parcelas: '3',
      prazo_medio: '28',
      pedido_minimo: '1.234,56',
      desconto: '2,50',
    })
  })

  it('serializes numeric and currency payload to api contract', () => {
    const payload = CONDICOES_PAGAMENTO_CONFIG.beforeSave?.({
      codigo: ' CP-10 ',
      nome: ' Prazo especial ',
      parcelas: '4',
      prazo_medio: '30',
      pedido_minimo: '1.234,56',
      juros: '1,50',
    })

    expect(payload).toMatchObject({
      codigo: 'CP-10',
      nome: 'Prazo especial',
      parcelas: 4,
      prazo_medio: 30,
      pedido_minimo: 1234.56,
      juros: 1.5,
    })
  })
})
