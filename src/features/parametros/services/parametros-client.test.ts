import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parametrosClient } from '@/src/features/parametros/services/parametros-client'
import type { ParametroListFilters } from '@/src/features/parametros/services/parametros-types'

const { httpClientMock } = vi.hoisted(() => ({
  httpClientMock: vi.fn(),
}))

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: httpClientMock,
}))

describe('parametros-client', () => {
  beforeEach(() => {
    httpClientMock.mockReset()
    httpClientMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, perpage: 15, pages: 1 },
    })
  })

  it('envia filtro de filial por id_filial', async () => {
    const filters: ParametroListFilters = {
      page: 1,
      perPage: 15,
      orderBy: 'chave',
      sort: 'asc',
      id: '',
      chave: 'header',
      id_filial: '42',
      id_filial_label: 'Matriz - 42',
      descricao: '',
      parametros: '',
      posicao: '',
      permissao: '',
      ativo: '',
    }

    await parametrosClient.list(filters)

    const requestPath = String(httpClientMock.mock.calls[0][0])
    const params = new URLSearchParams(requestPath.split('?')[1])

    expect(params.get('id_filial')).toBe('42')
    expect(params.get('filial')).toBeNull()
    expect(params.get('chave')).toBe('header')
  })
})
