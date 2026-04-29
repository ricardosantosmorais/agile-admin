import { cleanup, fireEvent, screen } from '@testing-library/react'
import { Trash2 } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SelectableDataTable } from '@/src/components/ui/selectable-data-table'
import { renderWithProviders } from '@/src/test/render'

afterEach(() => {
  cleanup()
})

describe('SelectableDataTable', () => {
  it('renders row actions and keeps the actions header centered', () => {
    const onRemove = vi.fn()

    renderWithProviders(
      <SelectableDataTable
        items={[{ id: '1', name: 'Empresa Teste' }]}
        selectedIds={[]}
        onSelectedIdsChange={vi.fn()}
        getRowId={(item) => item.id}
        columns={[{ header: 'Empresa', render: (item) => item.name }]}
        emptyMessage="Sem registros"
        actionsLabel="Ações"
        rowActions={(item) => [{ label: 'Remover', icon: Trash2, tone: 'danger', onClick: () => onRemove(item.id) }]}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Ações' })).toHaveClass('text-center')

    fireEvent.click(screen.getByRole('button', { name: /remover/i }))

    expect(onRemove).toHaveBeenCalledWith('1')
  })
})
