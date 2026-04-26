import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_MEUS_ATENDIMENTOS_FILTERS, meusAtendimentosClient } from '@/src/features/meus-atendimentos/services/meus-atendimentos-client'
import { httpClient } from '@/src/services/http/http-client'

vi.mock('@/src/services/http/http-client', () => ({
  httpClient: vi.fn(),
}))

describe('meus-atendimentos-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function toExpectedUnixTimestamp(date: string, endOfDay = false) {
    return String(Math.floor(new Date(`${date}T${endOfDay ? '23:59:59' : '00:00:00'}`).getTime() / 1000))
  }

  it('exposes the default filters expected by the screen', () => {
    expect(DEFAULT_MEUS_ATENDIMENTOS_FILTERS).toEqual({
      page: 1,
      perPage: 5,
      protocolo: '',
      status: '',
      dataInicio: '',
      dataFim: '',
    })
  })

  it('serializes filters, unix timestamps and cursor when listing records', async () => {
    vi.mocked(httpClient).mockResolvedValue({ data: [], meta: { page: 1, perPage: 5, total: 0 } })

    await meusAtendimentosClient.list({
      page: 3,
      perPage: 20,
      protocolo: ' 12345 ',
      status: ' aberto ',
      dataInicio: '2026-04-01',
      dataFim: '2026-04-10',
    }, 'cursor-9')

    expect(httpClient).toHaveBeenCalledWith(
      `/api/meus-atendimentos?page=3&perPage=20&protocolo=12345&status=aberto&dataInicio=${toExpectedUnixTimestamp('2026-04-01')}&dataFim=${toExpectedUnixTimestamp('2026-04-10', true)}&startingAfter=cursor-9`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    )
  })

  it('calls the detail and intercom binding bridges with the expected verbs', async () => {
    vi.mocked(httpClient).mockResolvedValue({ ok: true })

    await meusAtendimentosClient.getById('42')
    await meusAtendimentosClient.getIntercomBinding()
    await meusAtendimentosClient.saveIntercomBinding({
      appId: 'app-1',
      accessToken: 'token',
      workspaceName: 'Workspace',
    } as never)

    expect(httpClient).toHaveBeenNthCalledWith(1, '/api/meus-atendimentos/42', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(httpClient).toHaveBeenNthCalledWith(2, '/api/meus-atendimentos/intercom-binding', {
      method: 'GET',
      cache: 'no-store',
    })
    expect(httpClient).toHaveBeenNthCalledWith(3, '/api/meus-atendimentos/intercom-binding', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'app-1',
        accessToken: 'token',
        workspaceName: 'Workspace',
      }),
      cache: 'no-store',
    })
  })
})
