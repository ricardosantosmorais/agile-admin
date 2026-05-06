import { describe, expect, it } from 'vitest'
import {
  buildCatalogUniversePayload,
  CATALOG_UNIVERSE_TYPES,
  getCatalogUniverseLookupResource,
} from '@/src/features/catalog/components/catalog-universos-tab'

describe('catalog-universos-tab', () => {
  it('mantem os tipos de universo de banners na ordem do legado', () => {
    expect(CATALOG_UNIVERSE_TYPES.map((type) => type.value)).toEqual([
      'canal_distribuicao',
      'colecao',
      'departamento',
      'filial',
      'fornecedor',
      'grupo',
      'marca',
      'rede',
      'segmento',
      'tabela_preco',
      'uf',
    ])
  })

  it('mapeia os novos tipos de universo para lookups e payloads da API', () => {
    expect(getCatalogUniverseLookupResource('marca')).toBe('marcas')
    expect(getCatalogUniverseLookupResource('departamento')).toBe('departamentos')
    expect(getCatalogUniverseLookupResource('fornecedor')).toBe('fornecedores')
    expect(getCatalogUniverseLookupResource('colecao')).toBe('colecoes')

    expect(buildCatalogUniversePayload({
      tipo: 'fornecedor',
      restricao: true,
      objeto: { id: '44', label: 'Fornecedor' },
      uf: '',
    })).toEqual({
      tipo: 'fornecedor',
      restricao: true,
      id_fornecedor: '44',
    })
  })
})
