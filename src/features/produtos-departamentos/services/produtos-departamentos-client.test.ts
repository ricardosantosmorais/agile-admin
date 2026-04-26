import { beforeEach, describe, expect, it, vi } from 'vitest'
import { produtosDepartamentosClient } from '@/src/features/produtos-departamentos/services/produtos-departamentos-client'
import { httpClient } from '@/src/services/http/http-client'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

describe('produtos-departamentos-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serializes list filters into the expected query string', async () => {
    vi.mocked(httpClient).mockResolvedValue({ data: [], meta: { page: 1, perPage: 15, total: 0 } })

    await produtosDepartamentosClient.list({
      page: 2,
      perPage: 25,
      orderBy: 'produto:nome',
      sort: 'desc',
      id_produto: '10',
      'departamento:nome::like': 'frios',
    })

    expect(httpClient).toHaveBeenCalledWith(
      '/api/produtos-departamentos?page=2&perPage=25&orderBy=produto%3Anome&sort=desc&id_produto=10&departamento%3Anome%3A%3Alike=frios',
      {
        method: 'GET',
        cache: 'no-store',
      },
    )
  })

  it('posts create/delete payloads and auxiliary lookups to the dedicated bridges', async () => {
    vi.mocked(httpClient).mockResolvedValue({ ok: true })

    await produtosDepartamentosClient.create([{ id_produto: '10', id_departamento: '3' }])
    await produtosDepartamentosClient.delete([{ id_produto: '10', id_departamento: '3' }])
    await produtosDepartamentosClient.listSelectableProducts({
      page: 1,
      perPage: 15,
      q: 'camiseta',
      onlyWithoutDepartment: true,
    })
    await produtosDepartamentosClient.listDepartmentsTree()

    expect(httpClient).toHaveBeenNthCalledWith(1, '/api/produtos-departamentos', {
      method: 'POST',
      body: JSON.stringify({ items: [{ id_produto: '10', id_departamento: '3' }] }),
      cache: 'no-store',
    })
    expect(httpClient).toHaveBeenNthCalledWith(2, '/api/produtos-departamentos', {
      method: 'DELETE',
      body: JSON.stringify({ items: [{ id_produto: '10', id_departamento: '3' }] }),
      cache: 'no-store',
    })
    expect(httpClient).toHaveBeenNthCalledWith(3, '/api/produtos-departamentos/products?page=1&perPage=15&q=camiseta&onlyWithoutDepartment=1', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(httpClient).toHaveBeenNthCalledWith(4, '/api/produtos-departamentos/departments', {
      method: 'GET',
      cache: 'no-store',
    })
  })
})
