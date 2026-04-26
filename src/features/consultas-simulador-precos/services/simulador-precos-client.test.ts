import { beforeEach, describe, expect, it, vi } from 'vitest'
import { simuladorPrecosClient } from '@/src/features/consultas-simulador-precos/services/simulador-precos-client'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'
import { appData } from '@/src/services/app-data'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

vi.mock('@/src/components/crud-base/crud-client', () => ({
  loadCrudLookupOptions: vi.fn(),
}))

vi.mock('@/src/services/app-data', () => ({
  appData: {
    clients: {
      lookup: vi.fn(),
    },
  },
}))

describe('simulador-precos-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the context and simulation bridges with the expected payloads', async () => {
    vi.mocked(httpClient).mockResolvedValue({ data: {} })

    await simuladorPrecosClient.getContext()
    await simuladorPrecosClient.simulate({ id_produto: '10' } as never)

    expect(httpClient).toHaveBeenNthCalledWith(1, '/api/consultas/simulador-precos')
    expect(httpClient).toHaveBeenNthCalledWith(2, '/api/consultas/simulador-precos', {
      method: 'POST',
      body: JSON.stringify({ id_produto: '10' }),
    })
  })

  it('maps shared lookup options and short-circuits packaging calls without product id', async () => {
    vi.mocked(loadCrudLookupOptions).mockResolvedValue([{ value: '1', label: 'Filial Centro' }])

    expect(await simuladorPrecosClient.loadLookupOptions('filiais', '', 1, 15)).toEqual([
      { id: '1', label: 'Filial Centro' },
    ])
    expect(await simuladorPrecosClient.loadPackagingOptions('   ', '', 1, 15)).toEqual([])
  })

  it('delegates client lookups and packaging lookups to their dedicated data sources', async () => {
    vi.mocked(appData.clients.lookup).mockResolvedValue([{ id: '200', label: 'Cliente Ouro' }] as never)
    vi.mocked(httpClient).mockResolvedValue([{ value: '7', label: 'Caixa com 12' }])

    const clientOptions = await simuladorPrecosClient.loadClientOptions('ouro', 1, 15)
    const packagingOptions = await simuladorPrecosClient.loadPackagingOptions(' 55 ', '', 1, 15)

    expect(appData.clients.lookup).toHaveBeenCalledWith('clientes', 'ouro', 1, 15)
    expect(clientOptions).toEqual([{ id: '200', label: 'Cliente Ouro' }])
    expect(httpClient).toHaveBeenCalledWith('/api/lookups/produtos-embalagens?id_produto=55', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(packagingOptions).toEqual([{ id: '7', label: 'Caixa com 12' }])
  })
})
