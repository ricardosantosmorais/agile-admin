import { describe, expect, it } from 'vitest'
import {
  createCampanhaProdutoPayloads,
  createCompreJuntoProdutoPayload,
  normalizeCampanhaRecord,
  toCampanhaPayload,
} from '@/src/features/campanhas-promocionais/services/campanhas-mappers'

describe('campanhas-mappers', () => {
  it('normalizes campaign values from api', () => {
    const record = normalizeCampanhaRecord({
      ativo: 1,
      codigo: ' LP01 ',
      nome: ' Leve Pague ',
      tipo: 'leve_pague',
      quantidade_pedido: 4,
      quantidade_pagamento: 2,
      quantidade_maxima: 8,
      desconto: 12.5,
      data_inicio: '2026-03-20 00:00:00',
      data_fim: '2026-03-25 23:59:59',
    })

    expect(record.ativo).toBe(true)
    expect(record.codigo).toBe('LP01')
    expect(record.quantidade_pedido).toBe('4')
    expect(record.quantidade_pagamento).toBe('2')
    expect(record.quantidade_maxima).toBe('8')
    expect(record.desconto).toBe('12,5')
    expect(record.data_inicio).toBe('2026-03-20')
    expect(record.data_fim).toBe('2026-03-25')
  })

  it('builds leve e pague payload with numeric validations', () => {
    const payload = toCampanhaPayload({
      id: '11',
      ativo: true,
      codigo: ' LP02 ',
      nome: ' Campanha LP ',
      quantidade_pedido: '5',
      quantidade_pagamento: '3',
      quantidade_maxima: '9',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-30',
    }, 'leve_pague')

    expect(payload).toEqual({
      id: '11',
      codigo: 'LP02',
      nome: 'Campanha LP',
      tipo: 'leve_pague',
      ativo: true,
      data_inicio: '2026-03-20 00:00:00',
      data_fim: '2026-03-30 23:59:59',
      quantidade_pedido: 5,
      quantidade_pagamento: 3,
      quantidade_maxima: 9,
    })
  })

  it('builds desconto na unidade payload with parsed discount', () => {
    const payload = toCampanhaPayload({
      nome: ' Campanha desconto ',
      desconto: '12,50',
      quantidade_pedido: '2',
      quantidade_maxima: '',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-30',
    }, 'desconto_unidade')

    expect(payload.desconto).toBe(12.5)
    expect(payload.quantidade_pedido).toBe(2)
    expect(payload.quantidade_maxima).toBeNull()
  })

  it('creates product id payloads preserving order', () => {
    expect(createCampanhaProdutoPayloads('77', ' 9, 5 ,11 ')).toEqual([
      { id_campanha: '77', id_produto: '9', posicao: 1 },
      { id_campanha: '77', id_produto: '5', posicao: 2 },
      { id_campanha: '77', id_produto: '11', posicao: 3 },
    ])
  })

  it('creates compre junto relation payload', () => {
    expect(createCompreJuntoProdutoPayload('88', {
      id_produto: '19',
      principal: true,
      aplica_tributos: false,
      tipo: 'percentual',
      valor: '7,5',
    })).toEqual([
      {
        id_campanha: '88',
        id_produto: '19',
        principal: true,
        aplica_tributos: false,
        tipo: 'percentual',
        valor: 7.5,
      },
    ])
  })
})
