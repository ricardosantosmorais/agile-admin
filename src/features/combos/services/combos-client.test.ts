import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpClientMock = vi.fn()
const getByIdMock = vi.fn()

vi.mock('@/src/components/crud-base/crud-client', () => ({
  createCrudClient: () => ({
    list: vi.fn(),
    getById: getByIdMock,
    save: vi.fn(),
    delete: vi.fn(),
    listOptions: vi.fn(),
  }),
}))

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: (...args: unknown[]) => httpClientMock(...args),
}))

describe('combos-client', () => {
  beforeEach(() => {
    httpClientMock.mockReset()
    getByIdMock.mockReset()
  })

  it('loads combo products from the combo record embed', async () => {
    getByIdMock.mockResolvedValueOnce({ produtos: [] })
    const { combosClient } = await import('@/src/features/combos/services/combos-client')

    await combosClient.listProdutos('1803582468806887')

    expect(getByIdMock).toHaveBeenCalledWith('1803582468806887', 'produtos')
  })

  it('loads combo exceptions from the combo record embed', async () => {
    getByIdMock.mockResolvedValueOnce({ excecoes: [] })
    const { combosClient } = await import('@/src/features/combos/services/combos-client')

    await combosClient.listExcecoes('1803582468806887')

    expect(getByIdMock).toHaveBeenCalledWith('1803582468806887', 'excecoes')
  })
})
