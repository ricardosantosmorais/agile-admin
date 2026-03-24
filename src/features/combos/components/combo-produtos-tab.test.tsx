import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ComboProdutosTab } from '@/src/features/combos/components/combo-produtos-tab'
import { renderWithProviders } from '@/src/test/render'

vi.mock('@/src/features/combos/services/combos-client', () => ({
  combosClient: {
    listProdutos: vi.fn().mockResolvedValue([]),
    createProduto: vi.fn().mockResolvedValue({}),
    deleteProdutos: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock('@/src/components/ui/lookup-select', () => ({
  LookupSelect: ({ label }: { label: string }) => <div data-testid={`lookup-${label}`}>{label}</div>,
}))

describe('ComboProdutosTab', () => {
  it('shows package field only when the selected type is product', async () => {
    renderWithProviders(<ComboProdutosTab comboId="1" readOnly={false} onError={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /incluir|add/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /incluir|add/i }))
    await screen.findByText('Novo produto do combo')

    expect(screen.queryByText('Embalagem')).not.toBeInTheDocument()

    const typeSelect = Array.from(document.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'produto'),
    )

    expect(typeSelect).toBeTruthy()
    fireEvent.change(typeSelect!, { target: { value: 'produto' } })

    expect(await screen.findByText('Embalagem')).toBeInTheDocument()
  })
})
