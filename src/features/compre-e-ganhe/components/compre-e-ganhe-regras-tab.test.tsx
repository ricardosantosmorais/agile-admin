import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompreEGanheRegrasTab } from '@/src/features/compre-e-ganhe/components/compre-e-ganhe-regras-tab'
import { renderWithProviders } from '@/src/test/render'

const { listRegras } = vi.hoisted(() => ({
  listRegras: vi.fn().mockResolvedValue([{
    id: '1',
    id_regra: 'R1',
    tipo_regra: 'produto_pai',
    tipo: 'valor',
    pedido_minimo: 10,
    pedido_maximo: 25.5,
    produto_pai: { id: '7', nome: 'Produto Pai A' },
  }]),
}))

vi.mock('@/src/features/compre-e-ganhe/services/compre-e-ganhe-client', () => ({
  compreEGanheClient: {
    listRegras,
    createRegra: vi.fn().mockResolvedValue({}),
    deleteRegras: vi.fn().mockResolvedValue({ success: true }),
  },
}))

describe('CompreEGanheRegrasTab', () => {
  it('renders translated scope, translated type and currency values in the grid', async () => {
    renderWithProviders(<CompreEGanheRegrasTab brindeId="50" readOnly={false} onError={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('Produto pai')).toBeInTheDocument())
    expect(screen.getByText('Valor')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*10,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*25,50/)).toBeInTheDocument()
  })
})
