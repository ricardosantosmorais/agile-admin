import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InlineDataTable } from '@/src/components/ui/inline-data-table'
import { renderWithProviders } from '@/src/test/render'

afterEach(() => {
  cleanup()
})

describe('InlineDataTable', () => {
  it('renders headers, editable cells and empty state with the shared shell', () => {
    type Row = { id: string; name: string }

    const { rerender } = renderWithProviders(
      <InlineDataTable<Row>
        rows={[{ id: '1', name: 'Filial Centro' }]}
        getRowId={(item) => item.id}
        emptyMessage="Sem registros"
        columns={[
          { id: 'branch', header: 'Filial', cell: (item) => item.name },
          { id: 'token', header: 'Token', cell: () => <input aria-label="Token" defaultValue="abc" /> },
        ]}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Filial' })).toBeInTheDocument()
    expect(screen.getByLabelText('Token')).toHaveValue('abc')

    rerender(
      <InlineDataTable<Row>
        rows={[]}
        getRowId={(item) => item.id}
        emptyMessage="Sem registros"
        columns={[{ id: 'branch', header: 'Filial', cell: (item) => item.name }]}
      />,
    )

    expect(screen.getByText('Sem registros')).toBeInTheDocument()
  })
})
