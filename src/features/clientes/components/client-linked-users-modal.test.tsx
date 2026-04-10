import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClientLinkedUsersModal } from '@/src/features/clientes/components/client-linked-users-modal'
import { renderWithProviders } from '@/src/test/render'

describe('ClientLinkedUsersModal', () => {
  it('shows the empty state when there are no linked users', () => {
    renderWithProviders(
      <ClientLinkedUsersModal
        open
        client={{
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
        }}
        users={[]}
        isLoading={false}
        canDelete
        onClose={() => undefined}
        onRemove={() => undefined}
      />,
    )

    expect(screen.getByRole('heading', { name: /usuários vinculados - cliente xpto/i })).toBeInTheDocument()
    expect(screen.getByText(/Nenhum usu.rio vinculado encontrado\./i)).toBeInTheDocument()
  })

  it('calls onRemove when the user clicks the remove action', () => {
    const onRemove = vi.fn()

    renderWithProviders(
      <ClientLinkedUsersModal
        open
        client={{
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
        }}
        users={[
          {
            idCliente: '1',
            idUsuario: '99',
            email: 'cliente@teste.com',
            dataAtivacao: '2026-03-10T12:00:00Z',
          },
        ]}
        isLoading={false}
        canDelete
        onClose={() => undefined}
        onRemove={onRemove}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /remover/i }))

    expect(onRemove).toHaveBeenCalledWith('99')
  })
})
