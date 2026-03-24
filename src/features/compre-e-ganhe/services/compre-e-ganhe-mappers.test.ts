import { describe, expect, it } from 'vitest'
import {
  normalizeCompreEGanheRecord,
  toBrindeProdutoPayload,
  toBrindeRegraPayload,
  toBrindeUniversoPayload,
  toCompreEGanhePayload,
} from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-mappers'

describe('compre-e-ganhe-mappers', () => {
  it('normalizes main record for the form', () => {
    const record = normalizeCompreEGanheRecord({
      ativo: 1,
      gera_pedido: 0,
      codigo: ' BR01 ',
      nome: ' Brinde principal ',
      descricao: '<p>ok</p>',
      perfil: 'cliente',
      id_grupo_promocao: 7,
      maximo_brindes: 2,
      quantidade_maxima_cliente: 3,
      data_inicio: '2026-03-20 00:00:00',
      data_fim: '2026-03-30 23:59:59',
      imagem: ' /a.png ',
      imagem_mobile: ' /b.png ',
      grupo: { id: '7', nome: 'Grupo VIP' },
    })

    expect(record.ativo).toBe(true)
    expect(record.gera_pedido).toBe(false)
    expect(record.codigo).toBe('BR01')
    expect(record.id_grupo_promocao_lookup).toEqual({ id: '7', label: 'Grupo VIP' })
    expect(record.maximo_brindes).toBe('2')
    expect(record.data_inicio).toBe('2026-03-20')
  })

  it('builds main payload with dates and optional numbers', () => {
    const payload = toCompreEGanhePayload({
      id: '13',
      ativo: true,
      gera_pedido: true,
      codigo: ' BR02 ',
      nome: ' Campanha ',
      descricao: '<p>descrição</p>',
      id_grupo_promocao: '5',
      perfil: 'todos',
      maximo_brindes: '',
      quantidade_maxima_cliente: '4',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-28',
      imagem: '',
      imagem_mobile: '/mobile.png',
    })

    expect(payload).toEqual({
      id: '13',
      codigo: 'BR02',
      nome: 'Campanha',
      descricao: '<p>descrição</p>',
      id_grupo_promocao: '5',
      perfil: 'todos',
      maximo_brindes: null,
      quantidade_maxima_cliente: 4,
      data_inicio: '2026-03-20 00:00:00',
      data_fim: '2026-03-28 23:59:59',
      imagem: null,
      imagem_mobile: '/mobile.png',
      gera_pedido: true,
      ativo: true,
    })
  })

  it('builds rule payload based on selected scope', () => {
    const payload = toBrindeRegraPayload('90', {
      id_regra: 'R1',
      tipo_regra: 'produto',
      tipo: 'quantidade',
      id_produto: '44',
      id_embalagem: '3',
      pedido_minimo: 'R$ 2,50',
      pedido_maximo: 'R$ 10,90',
    })

    expect(payload.id_brinde).toBe('90')
    expect(payload.id_sync).toBe(9999)
    expect(payload.id_produto).toBe('44')
    expect(payload.id_embalagem).toBe('3')
    expect(payload.pedido_minimo).toBe(2.5)
    expect(payload.pedido_maximo).toBe(10.9)
  })

  it('builds gift product payload with optional rule and package', () => {
    expect(toBrindeProdutoPayload('91', {
      id_produto: '55',
      id_embalagem: '4',
      id_regra: 'R2',
      quantidade: '1',
      quantidade_maxima: '6',
    })).toEqual({
      id: undefined,
      id_brinde: '91',
      id_sync: 9999,
      id_produto: '55',
      id_embalagem: '4',
      id_regra: 'R2',
      quantidade: 1,
      quantidade_maxima: 6,
    })
  })

  it('builds universe payload and handles "todos"', () => {
    expect(toBrindeUniversoPayload('92', {
      id_regra: 'R9',
      universo: 'todos',
      id_objeto: 'ignored',
      ativo: false,
    })).toEqual({
      id: undefined,
      id_brinde: '92',
      id_regra: 'R9',
      universo: 'todos',
      id_objeto: '',
      ativo: false,
    })
  })
})
