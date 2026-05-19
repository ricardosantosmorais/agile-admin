import { describe, expect, it } from 'vitest'
import {
  encodeProdutoEmbalagemRowId,
  getProdutoEmbalagemApiId,
} from '@/src/features/produtos/services/produto-relations'

describe('produto relations', () => {
  it('returns the real produtos_embalagens id from a v2 encoded row id', () => {
    const encodedId = encodeProdutoEmbalagemRowId({
      id: 'emb-123',
      id_produto: 'prod-10',
      id_filial: 'filial-20',
    })

    expect(getProdutoEmbalagemApiId(encodedId, 'prod-10', 'filial-20')).toBe('emb-123')
  })

  it('strips the legacy product and branch suffix from embalagem id', () => {
    expect(getProdutoEmbalagemApiId('emb-123prod-10filial-20', 'prod-10', 'filial-20')).toBe('emb-123')
  })

  it('keeps a raw embalagem id when there is no encoded or composed suffix', () => {
    expect(getProdutoEmbalagemApiId('emb-123', 'prod-10', 'filial-20')).toBe('emb-123')
  })
})
