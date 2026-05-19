import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, POST } from '@/app/api/catalogos-digitais/route'
import { GET as GET_DETAIL } from '@/app/api/catalogos-digitais/[id]/route'
import { GET as GET_PREVIEW_HTML } from '@/app/api/catalogos-digitais/[id]/preview-html/route'
import { POST as POST_STUDIO } from '@/app/api/catalogos-digitais/studio/route'

const {
  agileV2FetchMock,
  readAuthSessionMock,
  serverApiFetchMock,
} = vi.hoisted(() => ({
  agileV2FetchMock: vi.fn(),
  readAuthSessionMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
}))

vi.mock('@/app/api/consultas/_shared', () => ({
  agileV2Fetch: agileV2FetchMock,
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

describe('catalogos-digitais route', () => {
  beforeEach(() => {
    agileV2FetchMock.mockReset()
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'empresa-1',
    })
    serverApiFetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { data: [], meta: { total: 0 } },
    })
    agileV2FetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { data: [] },
    })
  })

  it('forwards list filters to catalogos_digitais and loads app store contract summary', async () => {
    const request = new Request('http://localhost/api/catalogos-digitais?page=2&perpage=30&q=maio&status=pronto')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/^catalogos_digitais\?/), expect.objectContaining({
      method: 'GET',
      token: 'session-token',
      tenantId: 'empresa-1',
    }))
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('page=2')
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('perpage=30')
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('id_empresa=empresa-1')
    expect(serverApiFetchMock.mock.calls[0][0]).toContain('status=pronto')
    expect(new URLSearchParams(serverApiFetchMock.mock.calls[0][0].split('?')[1]).get('q')).toContain("nome like '%maio%'")
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'app-store/modulos?page=1&perpage=60&q=Cat%C3%A1logos+Digitais', expect.objectContaining({
      method: 'GET',
      token: 'session-token',
      tenantId: 'empresa-1',
    }))
  })

  it('forwards legacy code/name filters and applies validity overlap locally', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [
            {
              id: 'CAT-1',
              codigo: 'CAT-1',
              nome: 'Campanha Maio',
              metadata: JSON.stringify({ vigencia_inicio: '2026-05-01', vigencia_fim: '2026-05-31' }),
            },
            {
              id: 'CAT-2',
              codigo: 'CAT-2',
              nome: 'Campanha Junho',
              metadata: JSON.stringify({ vigencia_inicio: '2026-06-01', vigencia_fim: '2026-06-30' }),
            },
          ],
          meta: { total: 2 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: { data: [] },
      })

    const request = new Request('http://localhost/api/catalogos-digitais?page=1&perpage=15&code=CAT&name=Campanha&status=pronto&validFrom=2026-05-10&validTo=2026-05-20')

    const response = await GET(request)
    const payload = await response.json()
    const query = new URLSearchParams(serverApiFetchMock.mock.calls[0][0].split('?')[1])

    expect(response.status).toBe(200)
    expect(query.get('page')).toBe('1')
    expect(query.get('perpage')).toBe('5000')
    expect(query.get('status')).toBe('pronto')
    expect(query.get('q')).toContain("codigo like '%CAT%'")
    expect(query.get('q')).toContain("descricao like '%Campanha%'")
    expect(payload.data).toHaveLength(1)
    expect(payload.data[0].id).toBe('CAT-1')
    expect(payload.meta).toEqual(expect.objectContaining({ page: 1, perpage: 15, total: 1, pages: 1 }))
  })

  it('rejects requests without session', async () => {
    readAuthSessionMock.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/catalogos-digitais'))

    expect(response.status).toBe(401)
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })

  it('loads a catalog detail by active tenant and embeds products', async () => {
    const response = await GET_DETAIL(new Request('http://localhost/api/catalogos-digitais/CAT-1'), { params: Promise.resolve({ id: 'CAT-1' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais?id_empresa=empresa-1&id=CAT-1&embed=produtos&perpage=1',
      expect.objectContaining({
        method: 'GET',
        token: 'session-token',
        tenantId: 'empresa-1',
      }),
    )
  })

  it('renders the legacy studio HTML preview from the active tenant catalog snapshot', async () => {
    serverApiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{
          id: 'CAT-1',
          codigo: 'CAT-1',
          nome: 'Campanha Maio',
          metadata: JSON.stringify({
            snapshot: {
              nome: 'Campanha Maio',
              chamada_capa: 'Ofertas para clientes',
              template: 'executivo',
              saidas: { exibir_preco: true },
              produtos: [{ id: 'P1', codigo: 'P1', nome: 'Produto Integrado', preco_valor: 12.9 }],
              secoes: [{ tipo: 'produtos_grid', titulo: 'Produtos em destaque', produtos: ['P1'], mostrar_preco: true }],
            },
          }),
        }],
      },
    })

    const response = await GET_PREVIEW_HTML(new Request('http://localhost/api/catalogos-digitais/CAT-1/preview-html'), { params: Promise.resolve({ id: 'CAT-1' }) })
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais?id_empresa=empresa-1&id=CAT-1&embed=produtos&perpage=1',
      expect.objectContaining({
        method: 'GET',
        token: 'session-token',
        tenantId: 'empresa-1',
      }),
    )
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('Campanha Maio')
    expect(html).toContain('Produtos em destaque')
    expect(html).toContain('Produto Integrado')
  })

  it('saves a catalog payload with tenant context', async () => {
    const request = new Request('http://localhost/api/catalogos-digitais', {
      method: 'POST',
      body: JSON.stringify({
        id: 'CAT-1',
        nome: 'Campanha Junho',
        metadata: '{}',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais',
      expect.objectContaining({
        method: 'POST',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: expect.objectContaining({
          id: 'CAT-1',
          id_empresa: 'empresa-1',
          nome: 'Campanha Junho',
        }),
      }),
    )
  })

  it('deletes catalogs with tenant context', async () => {
    const request = new Request('http://localhost/api/catalogos-digitais', {
      method: 'DELETE',
      body: JSON.stringify({ ids: ['CAT-1', 'CAT-2'] }),
    })

    const response = await DELETE(request)

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'catalogos_digitais',
      expect.objectContaining({
        method: 'DELETE',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: [
          { id: 'CAT-1', id_empresa: 'empresa-1' },
          { id: 'CAT-2', id_empresa: 'empresa-1' },
        ],
      }),
    )
  })

  it('searches products for the studio using the same legacy product filters', async () => {
    serverApiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{
          id: 'PROD-1',
          codigo: 'SKU-1',
          nome: 'Produto Integrado',
          descricao_curta: 'Descricao curta',
          marca: { nome: 'Marca A' },
          imagens: [{ imagem: 'produtos/prod-1.jpg' }],
        }],
        meta: { total: 1 },
      },
    })

    const response = await POST_STUDIO(new Request('http://localhost/api/catalogos-digitais/studio', {
      method: 'POST',
      body: JSON.stringify({ action: 'searchProducts', q: 'Produto', perpage: 18 }),
    }))
    const body = await response.json()
    const query = new URLSearchParams(serverApiFetchMock.mock.calls[0][0].split('?')[1])

    expect(response.status).toBe(200)
    expect(serverApiFetchMock.mock.calls[0][0]).toMatch(/^produtos\?/)
    expect(query.get('embed')).toBe('imagens,url,marca,departamento,fornecedor')
    expect(query.get('id_empresa')).toBe('empresa-1')
    expect(query.get('q')).toContain("produtos.nome like '%Produto%'")
    expect(body.data).toEqual([
      expect.objectContaining({
        id: 'PROD-1',
        codigo: 'SKU-1',
        nome: 'Produto Integrado',
        marca: 'Marca A',
      }),
    ])
  })

  it('imports a collection and resolves its products in legacy order', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [{
            id: 'COL-1',
            codigo: 'COL-1',
            nome: 'Colecao Verão',
            produtos: [{ produto: { id: 'PROD-1' } }, { id: 'PROD-2' }],
          }],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [
            { id: 'PROD-2', codigo: 'SKU-2', nome: 'Produto 2' },
            { id: 'PROD-1', codigo: 'SKU-1', nome: 'Produto 1' },
          ],
          meta: { total: 2 },
        },
      })

    const response = await POST_STUDIO(new Request('http://localhost/api/catalogos-digitais/studio', {
      method: 'POST',
      body: JSON.stringify({ action: 'importCollection', id_colecao: 'COL-1' }),
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(
      1,
      'colecoes?id_empresa=empresa-1&id=COL-1&embed=produtos',
      expect.objectContaining({ method: 'GET', tenantId: 'empresa-1' }),
    )
    expect(serverApiFetchMock.mock.calls[1][0]).toContain('produtos?')
    expect(body.colecao).toEqual({ id: 'COL-1', codigo: 'COL-1', nome: 'Colecao Verão' })
    expect(body.data.map((item: Record<string, unknown>) => item.id)).toEqual(['PROD-1', 'PROD-2'])
  })

  it('renders an unsaved builder draft as HTML preview', async () => {
    const response = await POST_STUDIO(new Request('http://localhost/api/catalogos-digitais/studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'previewDraft',
        payload: {
          nome: 'Rascunho Maio',
          saidas: { exibir_preco: true },
          produtos: [{ id: 'PROD-1', codigo: 'SKU-1', nome: 'Produto do rascunho', preco_valor: 42 }],
          secoes: [{ tipo: 'produtos_grid', titulo: 'Produtos selecionados', produtos: ['PROD-1'], mostrar_preco: true }],
        },
      }),
    }))
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(html).toContain('Rascunho Maio')
    expect(html).toContain('Produtos selecionados')
    expect(html).toContain('Produto do rascunho')
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })

  it('loads pricing options for the active tenant using the legacy commercial context lookups', async () => {
    serverApiFetchMock.mockImplementation(async (path: string) => {
      if (path.startsWith('filiais?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'FIL-1', codigo: '001', nome_fantasia: 'Filial Centro' }] } }
      }
      if (path.startsWith('formas_pagamento?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'FP-1', nome: 'Boleto' }] } }
      }
      if (path.startsWith('condicoes_pagamento?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'CP-1', nome: '30 dias', indice: '1.05' }] } }
      }
      if (path.startsWith('tabelas_preco?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'TP-1', nome: 'Atacado' }] } }
      }
      if (path.includes('chave=modo_ecommerce')) {
        return { ok: true, status: 200, payload: { data: [{ chave: 'modo_ecommerce', parametros: 'b2b2c' }] } }
      }
      if (path.includes('chave=cod_emitente_ecommerce')) {
        return { ok: true, status: 200, payload: { data: [{ chave: 'cod_emitente_ecommerce', parametros: 'CLI-PADRAO' }] } }
      }
      return { ok: true, status: 200, payload: { data: [] } }
    })

    const response = await POST_STUDIO(new Request('http://localhost/api/catalogos-digitais/studio', {
      method: 'POST',
      body: JSON.stringify({ action: 'pricingOptions' }),
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(expect.stringMatching(/^filiais\?/), expect.objectContaining({ tenantId: 'empresa-1' }))
    expect(serverApiFetchMock).toHaveBeenCalledWith(expect.stringMatching(/^formas_pagamento\?/), expect.objectContaining({ tenantId: 'empresa-1' }))
    expect(serverApiFetchMock).toHaveBeenCalledWith(expect.stringMatching(/^condicoes_pagamento\?/), expect.objectContaining({ tenantId: 'empresa-1' }))
    expect(serverApiFetchMock).toHaveBeenCalledWith(expect.stringMatching(/^tabelas_preco\?/), expect.objectContaining({ tenantId: 'empresa-1' }))
    expect(body.data).toEqual(expect.objectContaining({
      modo_ecommerce: 'b2b2c',
      cliente_padrao_codigo: 'CLI-PADRAO',
      filiais: [{ id: 'FIL-1', codigo: '001', nome: 'Filial Centro' }],
      condicoes_pagamento: [{ id: 'CP-1', codigo: '', nome: '30 dias', indice: '1.05' }],
    }))
  })

  it('recalculates a catalog snapshot through API v2 and preserves price data in the product snapshot', async () => {
    serverApiFetchMock.mockImplementation(async (path: string) => {
      if (path.startsWith('empresas/parametros') && path.includes('modo_ecommerce')) {
        return { ok: true, status: 200, payload: { data: [{ parametros: 'b2b' }] } }
      }
      if (path.startsWith('empresas/parametros') && path.includes('cod_emitente_ecommerce')) {
        return { ok: true, status: 200, payload: { data: [] } }
      }
      if (path.startsWith('clientes?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'CLI-1', codigo: 'C001', cnpj_cpf: '123' }] } }
      }
      if (path.startsWith('vendedores?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'VEN-1', codigo: 'V001' }] } }
      }
      if (path.startsWith('condicoes_pagamento?')) {
        return { ok: true, status: 200, payload: { data: [{ id: 'CP-1', indice: '1.10' }] } }
      }
      if (path.startsWith('produtos?')) {
        return {
          ok: true,
          status: 200,
          payload: {
            data: [{
              id: 'PROD-1',
              codigo: 'SKU-1',
              nome: 'Produto Integrado',
              imagens: [{ imagem: 'produto.jpg' }],
            }],
          },
        }
      }
      return { ok: true, status: 200, payload: { data: [] } }
    })
    agileV2FetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{
          id: 'PROD-1',
          codigo: 'SKU-1',
          nome: 'Produto Integrado',
          id_filial: 'FIL-1',
          embalagens: [{ id: 'EMB-1', id_filial: 'FIL-1', quantidade: '1', preco_venda: '99.9', preco_base: '80' }],
          precificadores: [],
          tributos: [],
        }],
      },
    })

    const response = await POST_STUDIO(new Request('http://localhost/api/catalogos-digitais/studio', {
      method: 'POST',
      body: JSON.stringify({
        action: 'priceSnapshot',
        payload: {
          nome: 'Catalogo precificado',
          produtos: [{ id: 'PROD-1', codigo: 'SKU-1', nome: 'Produto Integrado' }],
          secoes: [{ tipo: 'produtos_grid', produtos: ['PROD-1'], mostrar_preco: true }],
          precificacao: {
            id_filial: 'FIL-1',
            id_forma_pagamento: 'FP-1',
            id_condicao_pagamento: 'CP-1',
            codigo_cliente: 'C001',
            id_vendedor: 'VEN-1',
            id_embalagem: 'EMB-1',
            quantidade: '2',
            valor_frete_item: '1.234,56',
          },
        },
      }),
    }))
    const body = await response.json()
    const query = agileV2FetchMock.mock.calls[0]?.[1]?.query as URLSearchParams

    expect(response.status).toBe(200)
    expect(query.get('id_empresa')).toBe('empresa-1')
    expect(query.get('id_cliente')).toBe('CLI-1')
    expect(query.get('id_vendedor')).toBe('VEN-1')
    expect(query.get('id_condicao_pagamento')).toBe('CP-1')
    expect(query.get('indice')).toBe('1.10')
    expect(query.get('embalagens[PROD-1]')).toBe('EMB-1')
    expect(query.get('quantidades[PROD-1]')).toBe('2')
    expect(query.get('valor_frete_item')).toBe('1234.56')
    expect(body.payload.produtos[0]).toEqual(expect.objectContaining({
      id: 'PROD-1',
      preco_status: 'ok',
      preco_valor: '99.9',
      preco_label: 'R$ 99,90',
      preco_snapshot: expect.objectContaining({
        preco_venda: '99.9',
        preco_base: '80',
        contexto: expect.objectContaining({ id_cliente: 'CLI-1' }),
      }),
    }))
    expect(body.meta).toEqual(expect.objectContaining({ precificado: true, precificados: 1 }))
  })
})
