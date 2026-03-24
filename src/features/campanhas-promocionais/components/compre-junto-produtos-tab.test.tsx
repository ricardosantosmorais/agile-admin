import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompreJuntoProdutosTab } from '@/src/features/campanhas-promocionais/components/compre-junto-produtos-tab'
import { renderWithProviders } from '@/src/test/render'

const { listProdutos, createProdutos, deleteProdutos } = vi.hoisted(() => ({
  listProdutos: vi.fn().mockResolvedValue([{ id_produto: '1', principal: true, produto: { id: '1', codigo: 'P1', nome: 'Produto principal' } }]),
  createProdutos: vi.fn().mockResolvedValue({}),
  deleteProdutos: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/src/features/campanhas-promocionais/services/campanhas-client', () => ({
  campanhasClient: {
    listProdutos,
    createProdutos,
    deleteProdutos,
  },
}))

vi.mock('@/src/components/ui/lookup-select', () => ({
  LookupSelect: ({ label, onChange }: { label: string; onChange: (value: { id: string; label: string }) => void }) => (
    <button type="button" onClick={() => onChange({ id: '9', label: 'Produto 9' })}>
      {label}
    </button>
  ),
}))

describe('CompreJuntoProdutosTab', () => {
  it('prevents creating a second primary product', async () => {
    renderWithProviders(<CompreJuntoProdutosTab campaignId="10" readOnly={false} onError={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /incluir|add/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /incluir|add/i }))
    await screen.findByText(/novo produto da campanha|new campaign product/i)

    fireEvent.click(screen.getByRole('button', { name: /principal/i }))
    fireEvent.click(screen.getByRole('button', { name: /^produto$|^product$/i }))

    const typeSelect = Array.from(document.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'percentual'),
    )
    expect(typeSelect).toBeTruthy()
    fireEvent.change(typeSelect!, { target: { value: 'percentual' } })

    fireEvent.change(screen.getByRole('textbox', { name: /valor|value/i }), { target: { value: '10' } })
    expect(screen.getByText('%')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /salvar|save/i }))

    await waitFor(() => {
      expect(screen.getByText('Já existe um produto principal ativo.')).toBeInTheDocument()
    })
    expect(createProdutos).not.toHaveBeenCalled()
  })

  it('switches the value field to currency when the type is fixed amount', async () => {
    renderWithProviders(<CompreJuntoProdutosTab campaignId="10" readOnly={false} onError={vi.fn()} />)

    await waitFor(() => expect(screen.getAllByRole('button', { name: /incluir|add/i })[0]).toBeInTheDocument())

    fireEvent.click(screen.getAllByRole('button', { name: /incluir|add/i })[0])
    await screen.findByText(/novo produto da campanha|new campaign product/i)

    const typeSelect = Array.from(document.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'valor_fixo'),
    )
    expect(typeSelect).toBeTruthy()
    fireEvent.change(typeSelect!, { target: { value: 'valor_fixo' } })

    expect(screen.getByText('R$')).toBeInTheDocument()
  })
})
