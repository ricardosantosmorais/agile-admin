import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompreEGanheUniversoTab } from '@/src/features/compre-e-ganhe/components/compre-e-ganhe-universo-tab'
import { renderWithProviders } from '@/src/test/render'

const { listExcecoes } = vi.hoisted(() => ({
  listExcecoes: vi.fn().mockResolvedValue([{ id: '1', universo: 'tabela_preco', id_objeto: '8' }]),
}))

vi.mock('@/src/features/compre-e-ganhe/services/compre-e-ganhe-client', () => ({
  compreEGanheClient: {
    listExcecoes,
    listRestricoes: vi.fn().mockResolvedValue([]),
    createExcecao: vi.fn().mockResolvedValue({}),
    createRestricao: vi.fn().mockResolvedValue({}),
    deleteExcecoes: vi.fn().mockResolvedValue({ success: true }),
    deleteRestricoes: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock('@/src/components/ui/lookup-select', () => ({
  LookupSelect: ({ label }: { label: string }) => <div data-testid={`lookup-${label}`}>{label}</div>,
}))

describe('CompreEGanheUniversoTab', () => {
  it('switches value input according to selected universe and renders translated labels', async () => {
    renderWithProviders(<CompreEGanheUniversoTab brindeId="50" readOnly={false} onError={vi.fn()} kind="excecoes" />)

    await waitFor(() => expect(screen.getByRole('button', { name: /incluir|add/i })).toBeInTheDocument())
    expect(screen.getByText(/tabela de pre[cç]o|price table/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /incluir|add/i }))
    await screen.findByText(/nova exce[cç][aã]o|new exception/i)

    const universeSelect = Array.from(document.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'cliente'),
    )
    expect(universeSelect).toBeTruthy()

    fireEvent.change(universeSelect!, { target: { value: 'cliente' } })
    expect(await screen.findByTestId(/lookup-valor|lookup-value/i)).toBeInTheDocument()

    fireEvent.change(universeSelect!, { target: { value: 'uf' } })
    expect(await screen.findByRole('option', { name: 'SP' })).toBeInTheDocument()
  })
})
