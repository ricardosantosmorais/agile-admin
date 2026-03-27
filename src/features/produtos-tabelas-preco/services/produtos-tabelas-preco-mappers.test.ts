import { describe, expect, it } from 'vitest'
import { encodeProdutoTabelaPrecoId, mapQuickPricingRows, serializeQuickPricingItems } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-mappers'

describe('produtos tabelas preco mappers', () => {
  it('encodes composite ids for list rows', () => {
    expect(encodeProdutoTabelaPrecoId('10', '20')).toBe('10|20')
  })

  it('maps quick pricing rows combining all price tables with current values', () => {
    const rows = mapQuickPricingRows(
      [{ id: '20', nome: 'Tabela A' }, { id: '30', nome: 'Tabela B' }],
      [{ id_tabela_preco: '20', preco1: 15.2, preco7: 40 }],
      '10',
    )

    expect(rows).toEqual([
      expect.objectContaining({ id_produto: '10', id_tabela_preco: '20', nome_tabela: 'Tabela A', preco1: '15,20', preco7: '40,00' }),
      expect.objectContaining({ id_produto: '10', id_tabela_preco: '30', nome_tabela: 'Tabela B', preco1: '', preco7: '' }),
    ])
  })

  it('serializes quick pricing rows to backend payload', () => {
    const payload = serializeQuickPricingItems(
      [{ id_tabela_preco: '20', preco1: '15,20', preco2: '', preco7: '40,00' }],
      '10',
      'empresa-1',
    )

    expect(payload).toEqual([
      {
        id_empresa: 'empresa-1',
        id_produto: '10',
        id_tabela_preco: '20',
        preco1: 15.2,
        preco2: 0,
        preco3: 0,
        preco4: 0,
        preco5: 0,
        preco6: 0,
        preco7: 40,
      },
    ])
  })
})
