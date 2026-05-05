import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/consultas/simulador-precos/route'

const { agileV2FetchMock, serverTenantFetchMock } = vi.hoisted(() => ({
  agileV2FetchMock: vi.fn(),
  serverTenantFetchMock: vi.fn(),
}))

vi.mock('@/app/api/consultas/_shared', () => ({
  agileV2Fetch: agileV2FetchMock,
  asArray: <T = unknown>(value: unknown) => Array.isArray(value) ? value as T[] : [],
  asRecord: (value: unknown) => typeof value === 'object' && value !== null ? value as Record<string, unknown> : {},
  extractApiErrorMessage: (payload: unknown, fallback: string) => {
    if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
      return payload.message
    }

    return fallback
  },
  resolveConsultasContext: vi.fn(async () => ({
    context: {
      token: 'token',
      tenantId: 'empresa-1',
      userId: 'user-1',
    },
  })),
  serverTenantFetch: serverTenantFetchMock,
  toStringValue: (value: unknown) => String(value ?? '').trim(),
}))

function createPayload(valorFreteItem: string) {
  return {
    id_produto: '10',
    id_embalagem: '7',
    quantidade: '2',
    id_filial: '3',
    id_forma_pagamento: '4',
    id_condicao_pagamento: '5',
    valor_frete_item: valorFreteItem,
  }
}

async function simulate(valorFreteItem: string) {
  return await POST(new NextRequest('http://localhost/api/consultas/simulador-precos', {
    method: 'POST',
    body: JSON.stringify(createPayload(valorFreteItem)),
  })) as Response
}

describe('consultas simulador-precos bridge', () => {
  beforeEach(() => {
    agileV2FetchMock.mockReset()
    serverTenantFetchMock.mockReset()

    serverTenantFetchMock.mockImplementation(async (_context, path: string) => {
      if (path.startsWith('produtos?')) {
        return {
          ok: true,
          status: 200,
          payload: {
            data: [{
              id: '10',
              codigo: 'P-10',
              nome: 'Produto 10',
              embalagens: [{ id: '7', id_filial: '3', quantidade: '1', preco_venda: '20.5' }],
            }],
          },
        }
      }

      if (path.startsWith('condicoes_pagamento?')) {
        return {
          ok: true,
          status: 200,
          payload: {
            data: [{ id: '5', indice: '1.00' }],
          },
        }
      }

      return {
        ok: true,
        status: 200,
        payload: { data: [] },
      }
    })

    agileV2FetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      payload: {
        data: [{
          id: '10',
          id_filial: '3',
          embalagens: [{ id: '7', id_filial: '3', quantidade: '1', preco_venda: '20.5' }],
          precificadores: [],
          tributos: [],
          promocoes_quantidade: [],
        }],
      },
    })
  })

  it('preserves decimal-dot freight values when forwarding the simulation to API v2', async () => {
    const response = await simulate('12.34')
    const query = agileV2FetchMock.mock.calls[0]?.[1]?.query as URLSearchParams

    expect(response.status).toBe(200)
    expect(query.get('valor_frete_item')).toBe('12.34')
  })

  it('normalizes masked Brazilian freight and keeps packaging in the legacy scalar format', async () => {
    const response = await simulate('1.234,56')
    const query = agileV2FetchMock.mock.calls[0]?.[1]?.query as URLSearchParams

    expect(response.status).toBe(200)
    expect(query.get('valor_frete_item')).toBe('1234.56')
    expect(query.get('embalagens[10]')).toBe('7')
    expect(query.has('embalagens[10][]')).toBe(false)
  })
})
