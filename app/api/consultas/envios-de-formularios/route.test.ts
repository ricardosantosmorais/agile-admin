import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as GETDetail } from '@/app/api/consultas/envios-de-formularios/[id]/route'
import { GET as GETExport } from '@/app/api/consultas/envios-de-formularios/export/route'
import { GET as GETList } from '@/app/api/consultas/envios-de-formularios/route'

const { serverTenantFetchMock } = vi.hoisted(() => ({
  serverTenantFetchMock: vi.fn(),
}))

vi.mock('@/app/api/consultas/_shared', () => ({
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

describe('consultas envios-de-formularios bridge', () => {
  beforeEach(() => {
    serverTenantFetchMock.mockReset()
  })

  it('lista envios usando contato como origem da pessoa quando nao existe cliente', async () => {
    serverTenantFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{
          id: '42',
          data: '2026-04-26 10:30:00',
          internalizado: '0',
          formulario: { id: '7', titulo: 'Atendimento' },
          contato: { nome_fantasia: 'Contato Loja', cnpj: '12345678000199' },
        }],
        meta: { page: 1, pages: 1, perpage: 15, from: 1, to: 1, total: 1 },
      },
    })

    const response = await GETList(new NextRequest('http://localhost/api/consultas/envios-de-formularios?cliente=Contato')) as Response
    const body = await response.json()
    const path = serverTenantFetchMock.mock.calls[0]?.[1] as string

    expect(response.status).toBe(200)
    expect(path).toContain('embed=cliente%2Ccontato%2Cformulario')
    expect(path).toContain('q=')
    expect(path).toContain('contatos.nome_fantasia')
    expect(body.data[0]).toMatchObject({
      clienteNome: 'Contato Loja',
      clienteDocumento: '12.345.678/0001-99',
    })
  })

  it('detalha envio com dados de contato quando nao existe cliente', async () => {
    serverTenantFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{
          id: '42',
          data: '2026-04-26 10:30:00',
          formulario: { titulo: 'Atendimento' },
          contato: { nome: 'Contato Operacional', cpf: '12345678901' },
          dados: [{ id: '1', valor: 'Sim', campo: { id: '10', titulo: 'Aceite', tipo: 'texto' } }],
        }],
      },
    })

    const response = await GETDetail(new Request('http://localhost/api/consultas/envios-de-formularios/42'), {
      params: Promise.resolve({ id: '42' }),
    }) as Response
    const body = await response.json()
    const path = serverTenantFetchMock.mock.calls[0]?.[1] as string

    expect(response.status).toBe(200)
    expect(path).toContain('embed=dados,formulario,cliente,contato')
    expect(body.data).toMatchObject({
      clienteNome: 'Contato Operacional',
      clienteDocumento: '123.456.789-01',
    })
  })

  it('exporta data, documento e nome da pessoa junto dos campos enviados', async () => {
    serverTenantFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{
          data: '2026-04-26 10:30:00',
          contato: { razao_social: 'Contato Razao', cnpj_cpf: '12345678000199' },
          dados: [
            { id: '1', valor: 'Azul', campo: { nome: 'cor', titulo: 'Cor', tipo: 'texto' } },
            { id: '2', valor: 'arquivo.pdf', campo: { nome: 'anexo', titulo: 'Anexo', tipo: 'arquivo' } },
          ],
        }],
      },
    })

    const response = await GETExport(new NextRequest('http://localhost/api/consultas/envios-de-formularios/export?id_formulario=7')) as Response
    const body = await response.json()
    const path = serverTenantFetchMock.mock.calls[0]?.[1] as string

    expect(response.status).toBe(200)
    expect(path).toContain('embed=dados,cliente,contato')
    expect(body.data[0]).toMatchObject({
      data_envio: '2026-04-26 10:30:00',
      cnpj_cpf: '12345678000199',
      nome_fantasia: 'Contato Razao',
      cor: 'Azul',
    })
    expect(body.data[0].anexo).toContain('visualizar-arquivo.php?arquivo=arquivo.pdf')
  })
})
