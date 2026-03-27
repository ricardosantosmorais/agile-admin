import { describe, expect, it } from 'vitest'
import { decodeProdutoFilialId, encodeProdutoFilialId } from '@/src/features/produtos-filiais/services/produtos-filiais-keys'

describe('produtos filiais keys', () => {
  it('encodes and decodes composite ids', () => {
    const encoded = encodeProdutoFilialId({
      id_produto: '100',
      id_filial: '200',
      id_tabela_preco: '300',
      id_canal_distribuicao_cliente: '400',
    })

    expect(encoded).toBe('100|200|300|400')
    expect(decodeProdutoFilialId(encoded)).toEqual({
      id_produto: '100',
      id_filial: '200',
      id_tabela_preco: '300',
      id_canal_distribuicao_cliente: '400',
    })
  })
})
