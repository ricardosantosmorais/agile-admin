import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePedidoActions } from '@/src/features/pedidos/components/use-pedido-actions'
import { pedidosClient } from '@/src/features/pedidos/services/pedidos-client'
import { renderWithProviders } from '@/src/test/render'

vi.mock('@/src/features/pedidos/services/pedidos-client', () => ({
  pedidosClient: {
    approve: vi.fn(),
    cancel: vi.fn(),
  },
}))

function PedidoActionsHarness({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const actions = usePedidoActions(onSuccess)

  return (
    <>
      <button type="button" onClick={() => actions.openApprove('100')}>
        Abrir aprovar
      </button>
      <button type="button" onClick={() => actions.openCancel('100')}>
        Abrir cancelar
      </button>
      {actions.dialogs}
    </>
  )
}

describe('usePedidoActions', () => {
  const approveMock = vi.mocked(pedidosClient.approve)
  const cancelMock = vi.mocked(pedidosClient.cancel)
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    approveMock.mockResolvedValue({ success: true } as never)
    cancelMock.mockResolvedValue({ success: true } as never)
  })

  afterEach(() => {
    cleanup()
  })

  it('approves the payment and shows success feedback', async () => {
    renderWithProviders(<PedidoActionsHarness onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir aprovar' }))
    fireEvent.click(await screen.findByRole('button', { name: /aprovar pagamento/i }))

    await waitFor(() => {
      expect(approveMock).toHaveBeenCalledWith('100')
    })

    expect(onSuccess).toHaveBeenCalled()
    expect(await screen.findByText('Pagamento aprovado com sucesso.')).toBeInTheDocument()
  })

  it('requires a cancellation reason before submitting', async () => {
    renderWithProviders(<PedidoActionsHarness onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir cancelar' }))
    fireEvent.click(await screen.findByRole('button', { name: /^cancelar pedido$/i }))

    expect(await screen.findByText('Informe o motivo do cancelamento.')).toBeInTheDocument()
    expect(cancelMock).not.toHaveBeenCalled()
  })
})
