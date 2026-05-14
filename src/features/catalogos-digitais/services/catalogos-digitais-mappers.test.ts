import { describe, expect, it } from 'vitest'
import { normalizeCatalogosDigitaisListResponse } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'

describe('catalogos-digitais-mappers', () => {
  it('normalizes catalog rows from metadata snapshot and app store contract', () => {
    const response = normalizeCatalogosDigitaisListResponse({
      data: [{
        id: 'CAT-1',
        codigo: 'CAT-1',
        nome: 'Campanha Maio',
        descricao: 'Ofertas para clientes',
        status: 'pronto',
        publicado: true,
        mostrar_preco: true,
        metadata: JSON.stringify({
          produto_count: 12,
          secao_count: 4,
          modelo: 'campanha_promocional',
          template: 'executivo',
          modo_publicacao: 'publica',
          vigencia_inicio: '2026-05-01',
          vigencia_fim: '2026-05-31',
        }),
      }],
      meta: { page: '2', perpage: '15', total: '21', pages: '3' },
      appStore: {
        id: 'mod_catalogos_digitais',
        contratacao: { contratado: true, status: 'ativo' },
      },
    })

    expect(response.items[0]).toMatchObject({
      id: 'CAT-1',
      code: 'CAT-1',
      name: 'Campanha Maio',
      status: 'pronto',
      published: true,
      showPrice: true,
      productCount: 12,
      sectionCount: 4,
      publicationMode: 'publica',
      validFrom: '2026-05-01',
      validTo: '2026-05-31',
    })
    expect(response.meta).toEqual({ page: 2, perPage: 15, total: 21, pages: 3 })
    expect(response.appStore).toEqual({ moduleId: 'mod_catalogos_digitais', contracted: true, status: 'ativo', error: '' })
  })

  it('falls back to snapshot counts and not contracted app store state', () => {
    const response = normalizeCatalogosDigitaisListResponse({
      data: [{
        id: 'CAT-2',
        nome: 'Rascunho',
        metadata: {
          snapshot: {
            produtos: [{ id: '1' }, { id: '2' }],
            secoes: [{ id: 'intro' }],
            saidas: { modo_publicacao: 'restrito_cliente' },
          },
        },
      }],
      appStore: { id: 'mod_catalogos_digitais', contratacao: { status: 'cancelado' } },
    })

    expect(response.items[0]).toMatchObject({
      productCount: 2,
      sectionCount: 1,
      publicationMode: 'restrita_cliente',
      active: true,
    })
    expect(response.appStore.contracted).toBe(false)
  })
})
