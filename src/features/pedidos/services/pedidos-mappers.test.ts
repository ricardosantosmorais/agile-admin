import { describe, expect, it } from 'vitest'
import { normalizePedidoDetail, normalizePedidoListRecord } from '@/src/features/pedidos/services/pedidos-mappers'

describe('pedidos mappers', () => {
  it('normaliza a listagem com status e flags operacionais', () => {
    const record = normalizePedidoListRecord({
      id: '10',
      status: 'aguardando_pagamento',
      valor_total_atendido: 123.45,
      cliente: { razao_social: 'Cliente Teste' },
      vendedor: { nome: 'Vendedor Teste' },
      entrega: { forma_entrega_nome: 'Entrega expressa' },
      pagamento: { forma_pagamento_tipo: 'cartao_credito' },
      produtos: [{ quantidade: 10, quantidade_atendida: 8 }],
    })

    expect(record.status_label).toBe('Aguardando pagamento')
    expect(record.hasCorte).toBe(true)
    expect(record.canApprovePayment).toBe(true)
    expect(record.canCancel).toBe(true)
  })

  it('ajusta os valores atendidos no detalhe quando tributos nao estao somados', () => {
    const detail = normalizePedidoDetail({
      id: '20',
      status: 'aguardando_pagamento',
      total_atendido_tributos: false,
      valor_produtos_atendido: 100,
      valor_total_atendido: 110,
      valor_st: 5,
      valor_ipi: 2,
      valor_fecoep: 1,
      valor_partilha: 2,
      pagamento: { forma_pagamento_tipo: 'cartao_credito' },
      produtos: [],
    })

    expect(detail.valor_produtos_atendido_ajustado).toBe(110)
    expect(detail.valor_total_atendido_ajustado).toBe(120)
    expect(detail.status_label).toBe('Aguardando pagamento')
    expect(detail.canApprovePayment).toBe(true)
    expect(detail.canCancel).toBe(true)
  })
})
