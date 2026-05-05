import { describe, expect, it } from 'vitest'
import { PEDIDO_DELIVERY_STATUS_OPTIONS } from '@/src/features/pedidos/services/pedidos-meta'
import {
  filterPedidoLogsByAccess,
  getPedidoProductTechnicalArtifacts,
  isTechnicalPedidoLog,
  normalizePedidoDetail,
  normalizePedidoListRecord,
} from '@/src/features/pedidos/services/pedidos-mappers'

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

  it('mantem os status de entrega adicionados no legado', () => {
    expect(PEDIDO_DELIVERY_STATUS_OPTIONS.map((option) => option.value)).toEqual([
      'aguardando',
      'pronto_retirada',
      'coletado',
      'devolvido',
      'em_transporte',
      'entregue',
      'solicitado',
    ])
  })

  it('filtra logs tecnicos para usuarios que nao sao master', () => {
    const logs = [
      { codigo: 'checkout', descricao: 'Operacional' },
      { codigo: 'processing_price', descricao: 'Tecnico' },
      { codigo: 'origin_trace_snapshot', descricao: 'Rastreabilidade' },
    ]

    expect(isTechnicalPedidoLog(logs[1])).toBe(true)
    expect(isTechnicalPedidoLog(logs[2])).toBe(true)
    expect(filterPedidoLogsByAccess(logs, false)).toEqual([logs[0]])
    expect(filterPedidoLogsByAccess(logs, true)).toEqual(logs)
  })

  it('normaliza artefatos tecnicos do produto para acoes master no detalhe', () => {
    const artifacts = getPedidoProductTechnicalArtifacts({
      memoria_preco: { preco_venda: 10 },
      metadata: {
        origin_trace: {
          source: 'price_engine',
        },
      },
    })

    expect(artifacts.priceMemory).toBe(JSON.stringify({ preco_venda: 10 }, null, 2))
    expect(artifacts.originTrace).toBe(JSON.stringify({ source: 'price_engine' }, null, 2))
  })
})
