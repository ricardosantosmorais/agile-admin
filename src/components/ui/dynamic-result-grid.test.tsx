import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DynamicResultGrid } from '@/src/components/ui/dynamic-result-grid'
import { renderWithProviders } from '@/src/test/render'

afterEach(() => {
  cleanup()
})

describe('DynamicResultGrid', () => {
  it('renders dynamic headers and object cells without feature-local table markup', () => {
    renderWithProviders(
      <DynamicResultGrid
        rows={[{ id: 1, nome: 'Teste', payload: { ok: true } }, { id: 2, extra: 'Coluna tardia' }]}
        emptyMessage="Sem dados"
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'id' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'nome' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'extra' })).toBeInTheDocument()
    expect(screen.getByText('{"ok":true}')).toBeInTheDocument()
  })

  it('filters rows by search across dynamic columns', () => {
    renderWithProviders(
      <DynamicResultGrid
        rows={[{ id: 1, nome: 'Pedido' }, { id: 2, nome: 'Cliente' }]}
        emptyMessage="Sem dados"
        search="cli"
      />,
    )

    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.queryByText('Pedido')).not.toBeInTheDocument()
  })

  it('shows the empty message when there are no rows', () => {
    renderWithProviders(<DynamicResultGrid rows={[]} emptyMessage="Sem dados" />)

    expect(screen.getByText('Sem dados')).toBeInTheDocument()
  })
})
