import { describe, expect, it } from 'vitest'
import {
  createEmptyCatalogoDigitalForm,
  normalizeCatalogoDigitalDetail,
  normalizeCatalogosDigitaisListResponse,
  toCatalogoDigitalSavePayload,
} from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'

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

  it('normalizes detail snapshot for the first studio edit slice', () => {
    const form = normalizeCatalogoDigitalDetail({
      data: {
        id: 'CAT-1',
        codigo: 'CAT-1',
        nome: 'Campanha Maio',
        descricao: 'Ofertas para clientes especiais',
        ativo: 1,
        mostrar_preco: 1,
        metadata: JSON.stringify({
          modelo: 'campanha_promocional',
          template: 'executivo',
          objetivo: 'promocional',
          modo_publicacao: 'publica',
          vigencia_inicio: '2026-05-01',
          vigencia_fim: '2026-05-31',
          snapshot: {
            nome: 'Campanha Maio',
            chamada_capa: 'Ofertas para clientes especiais',
            produtos: [{ id: 'PROD-1' }],
            secoes: [{ id: 'sec-1', tipo: 'titulo' }],
            saidas: {
              modo_publicacao: 'publica',
              exibir_preco: true,
            },
          },
        }),
      },
    })

    expect(form).toMatchObject({
      id: 'CAT-1',
      code: 'CAT-1',
      name: 'Campanha Maio',
      coverCall: 'Ofertas para clientes especiais',
      model: 'campanha_promocional',
      template: 'executivo',
      objective: 'promocional',
      publicationMode: 'publica',
      validFrom: '2026-05-01',
      validTo: '2026-05-31',
      showPrice: true,
      active: true,
    })
    expect(form.products).toHaveLength(1)
    expect(form.sections).toHaveLength(1)
  })

  it('builds a save payload preserving products and sections from the legacy snapshot', () => {
    const form = {
      ...createEmptyCatalogoDigitalForm(),
      id: 'CAT-1',
      code: 'CAT-1',
      name: 'Campanha Junho',
      coverCall: 'Ofertas renovadas',
      model: 'campanha_promocional',
      template: 'executivo',
      objective: 'promocional',
      publicationMode: 'restrita_cliente',
      validFrom: '2026-06-01',
      validTo: '2026-06-30',
      showPrice: false,
      active: true,
      products: [{ id: 'PROD-1' }],
      sections: [{ id: 'sec-1', tipo: 'titulo' }],
      snapshot: {
        origem_produtos: 'colecao',
        produtos: [{ id: 'PROD-1' }],
        secoes: [{ id: 'sec-1', tipo: 'titulo' }],
        saidas: {
          modo_publicacao: 'publica',
          exibir_preco: true,
        },
      },
    }

    const payload = toCatalogoDigitalSavePayload(form)
    const metadata = JSON.parse(String(payload.metadata)) as Record<string, unknown>
    const snapshot = metadata.snapshot as Record<string, unknown>
    const outputs = snapshot.saidas as Record<string, unknown>

    expect(payload).toMatchObject({
      id: 'CAT-1',
      codigo: 'CAT-1',
      nome: 'Campanha Junho',
      descricao: 'Ofertas renovadas',
      status: 'pronto',
      origem_produtos: 'colecao',
      restrito: true,
      publicado: true,
      mostrar_preco: false,
      ativo: true,
    })
    expect(snapshot.produtos).toEqual([{ id: 'PROD-1' }])
    expect(snapshot.secoes).toEqual([{ id: 'sec-1', tipo: 'titulo' }])
    expect(outputs).toMatchObject({
      modo_publicacao: 'restrita_cliente',
      exibir_preco: false,
    })
    expect(metadata).toMatchObject({
      produto_count: 1,
      secao_count: 1,
      modo_publicacao: 'restrita_cliente',
      vigencia_inicio: '2026-06-01',
      vigencia_fim: '2026-06-30',
    })
  })
})
