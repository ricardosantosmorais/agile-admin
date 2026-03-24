import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClientViewModal } from '@/src/features/clientes/components/client-view-modal'
import { renderWithProviders } from '@/src/test/render'

describe('ClientViewModal', () => {
  it('shows the compact customer summary with the key fields from the list', () => {
    renderWithProviders(
      <ClientViewModal
        open
        client={{
          id: '1',
          codigo: '123',
          codigoAtivacao: 'ABC',
          cnpjCpf: '12.345.678/0001-99',
          inscricaoEstadual: '123456',
          nomeRazaoSocial: 'Cliente XPTO',
          dataAtivacao: '2026-01-20',
          ultimoPedido: '2026-03-01',
          qtdPedidos: 18,
          bloqueado: true,
          bloqueadoPlataforma: false,
          ativo: true,
        }}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByRole('heading', { name: /visualizar - cliente xpto/i })).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.getByText('12.345.678/0001-99')).toBeInTheDocument()
    expect(screen.getByText('Cliente XPTO')).toBeInTheDocument()
    expect(screen.getByText('123456')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('Plataforma liberada')).toBeInTheDocument()
  })
})
