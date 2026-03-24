import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampanhaProdutosIdsTab } from '@/src/features/campanhas-promocionais/components/campanha-produtos-ids-tab'
import { renderWithProviders } from '@/src/test/render'

const { listProdutos, createProdutos, deleteProdutos, resolveProdutos } = vi.hoisted(() => ({
  listProdutos: vi.fn().mockResolvedValue([]),
  createProdutos: vi.fn().mockResolvedValue({}),
  deleteProdutos: vi.fn().mockResolvedValue({ success: true }),
  resolveProdutos: vi.fn().mockResolvedValue({
    resolved: [{ token: 'SKU-9', id: '9', label: 'Produto 9 - 9' }],
    missing: [],
  }),
}))

vi.mock('@/src/features/campanhas-promocionais/services/campanhas-client', () => ({
  campanhasClient: {
    listProdutos,
    createProdutos,
    deleteProdutos,
    resolveProdutos,
  },
}))

vi.mock('@/src/components/ui/lookup-select', () => ({
  LookupSelect: ({ label, onChange }: { label: string; onChange: (value: { id: string; label: string }) => void }) => (
    <button type="button" onClick={() => onChange({ id: '21', label: 'Produto 21 - 21' })}>
      {label}
    </button>
  ),
}))

describe('CampanhaProdutosIdsTab', () => {
  it('creates product relations from ids, codes and autocomplete', async () => {
    renderWithProviders(<CampanhaProdutosIdsTab campaignId="10" readOnly={false} onError={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /incluir|add/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /incluir|add/i }))
    await screen.findByText(/vincular produtos|link products/i)

    expect(screen.getByText(/m[eé]todo 1: buscar e selecionar|method 1: search and select/i)).toBeInTheDocument()
    expect(screen.getByText(/m[eé]todo 2: informar ids ou c[oó]digos|method 2: enter ids or codes/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /produto por busca|product search/i }))
    fireEvent.change(screen.getByPlaceholderText(/c[oó]digos|codes/i), { target: { value: 'SKU-9' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar|save/i }))

    await waitFor(() => expect(resolveProdutos).toHaveBeenCalledWith(['SKU-9']))
    await waitFor(() => expect(createProdutos).toHaveBeenCalledWith([
      { id_campanha: '10', id_produto: '9', posicao: 1 },
      { id_campanha: '10', id_produto: '21', posicao: 2 },
    ]))
  })
})
