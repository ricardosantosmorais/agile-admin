import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useClientesListController } from '@/src/features/clientes/hooks/use-clientes-list-controller'
import { appData } from '@/src/services/app-data'

describe('useClientesListController', () => {
  const listMock = vi.spyOn(appData.clients, 'list')
  const getLinkedUsersMock = vi.spyOn(appData.clients, 'getLinkedUsers')

  beforeEach(() => {
    window.sessionStorage.clear()
    vi.clearAllMocks()

    listMock.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        pages: 1,
        perPage: 15,
        total: 0,
        from: 0,
        to: 0,
        order: 'razao_social',
        sort: 'asc',
      },
    })

    getLinkedUsersMock.mockResolvedValue([])
  })

  it('uses the accented fallback message when the list request fails', async () => {
    listMock.mockRejectedValueOnce({})

    const { result } = renderHook(() => useClientesListController({ canDelete: true }))

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false)
    })

    expect(result.current.state.error?.message).toBe('Não foi possível carregar os clientes.')
  })

  it('uses the accented fallback message when loading linked users fails', async () => {
    getLinkedUsersMock.mockRejectedValueOnce({})

    const { result } = renderHook(() => useClientesListController({ canDelete: true }))

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false)
    })

    await result.current.openLinkedUsers({
      id: '1',
      codigo: '900000',
      codigoAtivacao: 'ABC',
      cnpjCpf: '00.000.000/0000-00',
      inscricaoEstadual: '',
      nomeRazaoSocial: 'Cliente XPTO',
      dataAtivacao: '',
      ultimoPedido: '',
      qtdPedidos: 0,
      bloqueado: false,
      bloqueadoPlataforma: false,
      ativo: true,
    })

    await waitFor(() => {
      expect(result.current.modalError).toBe('Não foi possível carregar os usuários vinculados.')
    })
  })
})
