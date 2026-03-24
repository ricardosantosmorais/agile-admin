import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContatoDetailModal } from '@/src/features/contatos/components/contato-detail-modal'
import { renderWithProviders } from '@/src/test/render'

afterEach(() => {
  cleanup()
})

describe('ContatoDetailModal', () => {
  it('shows approve and reject actions only for received contacts', () => {
    const onApprove = vi.fn()
    const onReject = vi.fn()

    renderWithProviders(
      <ContatoDetailModal
        open
        detail={{
          id: '1',
          status: 'recebido',
          nome_fantasia: 'Loja XPTO',
          cnpj_cpf: '12345678000199',
        }}
        isLoading={false}
        canEdit
        onClose={() => undefined}
        onApprove={onApprove}
        onReject={onReject}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }))
    fireEvent.click(screen.getByRole('button', { name: /reprovar/i }))

    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(onReject).toHaveBeenCalledTimes(1)
  })

  it('hides edit actions for approved contacts', () => {
    renderWithProviders(
      <ContatoDetailModal
        open
        detail={{
          id: '1',
          status: 'aprovado',
          nome_fantasia: 'Loja XPTO',
          cnpj_cpf: '12345678000199',
        }}
        isLoading={false}
        canEdit
        onClose={() => undefined}
      />,
    )

    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reprovar/i })).not.toBeInTheDocument()
  })
})
