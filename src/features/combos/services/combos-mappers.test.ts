import { describe, expect, it } from 'vitest'
import {
  formatApiDateToInput,
  formatComboProdutoDiscount,
  formatComboProdutoPrice,
  formatExceptionDateRangeLabel,
  formatMoneyInput,
  normalizeComboRecord,
  parseMoneyValue,
  toComboExcecaoPayload,
  toComboPayload,
  toComboProdutoPayload,
} from '@/src/features/combos/services/combos-mappers'

describe('combos-mappers', () => {
  it('normalizes combo payload from api to form fields', () => {
    const record = normalizeComboRecord({
      ativo: 1,
      aceita_parcial: 0,
      codigo: ' CMB01 ',
      nome: 'Combo teste',
      tipo: 'faixa_quantidade',
      origem_preco: 'preco_venda',
      id_grupo_promocao: '7',
      grupo: { id: '7', nome: 'Grupo A' },
      data_inicio: '2026-03-20 00:00:00',
      data_fim: '2026-03-31 23:59:59',
      itens_distintos: 3,
      descricao: '<p>ok</p>',
})

    expect(record.ativo).toBe(true)
    expect(record.aceita_parcial).toBe(false)
    expect(record.id_grupo_promocao_lookup).toEqual({ id: '7', label: 'Grupo A' })
    expect(record.data_inicio).toBe('2026-03-20')
    expect(record.data_fim).toBe('2026-03-31')
    expect(record.itens_distintos).toBe('3')
  })

  it('builds combo payload with normalized values', () => {
    const payload = toComboPayload({
      ativo: true,
      aceita_parcial: true,
      codigo: ' CMB02 ',
      nome: 'Combo principal',
      tipo: 'quantidade_minima',
      origem_preco: 'preco_base',
      id_grupo_promocao: '5',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-25',
      itens_distintos: '',
      descricao: '<p>descrição</p>',
    })

    expect(payload.codigo).toBe('CMB02')
    expect(payload.ativo).toBe(true)
    expect(payload.aceita_parcial).toBe(true)
    expect(payload.id_grupo_promocao).toBe('5')
    expect(payload.data_inicio).toBe('2026-03-20 00:00:00')
    expect(payload.data_fim).toBe('2026-03-25 23:59:59')
    expect(payload.itens_distintos).toBe(0)
  })

  it('builds product relation payload with parsed monetary values', () => {
    const payload = toComboProdutoPayload('123', {
      tipo: 'produto',
      altera_quantidade: true,
      id_produto: '99',
      id_embalagem: '8',
      preco: '1.234,56',
      desconto: '10,50',
      pedido_minimo: '2',
      pedido_maximo: '5',
    })

    expect(payload.id_promocao).toBe('123')
    expect(payload.id_produto).toBe('99')
    expect(payload.id_embalagem).toBe('8')
    expect(payload.preco).toBe(1234.56)
    expect(payload.desconto).toBe(10.5)
    expect(payload.pedido_minimo).toBe(2)
    expect(payload.pedido_maximo).toBe(5)
  })

  it('builds exception payload for special universe types', () => {
    const taxpayerPayload = toComboExcecaoPayload('123', {
      universo: 'contribuinte',
      contribuinte: '1',
      id_filial: '10',
      data_inicio: '2026-03-20',
      data_fim: '2026-03-21',
    })

    expect(taxpayerPayload.id_objeto_universo).toBe('1')
    expect(taxpayerPayload.id_filial).toBe('10')
    expect(taxpayerPayload.data_inicio).toBe('2026-03-20 00:00:00')
    expect(taxpayerPayload.data_fim).toBe('2026-03-21 23:59:59')

    const allPayload = toComboExcecaoPayload('123', { universo: 'todos' })
    expect(allPayload.id_objeto_universo).toBe('')
  })

  it('formats numeric and date helpers consistently', () => {
    expect(parseMoneyValue('1.234,56')).toBe(1234.56)
    expect(formatMoneyInput(1234.56)).toBe('1.234,56')
    expect(formatApiDateToInput('2026-03-20 10:00:00')).toBe('2026-03-20')
    expect(formatComboProdutoPrice(25)).toBe('R$ 25,00')
    expect(formatComboProdutoDiscount(7.5)).toBe('7,50%')
    expect(formatExceptionDateRangeLabel('2026-03-20 00:00:00', '2026-03-25 23:59:59')).toBe('2026-03-20 - 2026-03-25')
  })
})
