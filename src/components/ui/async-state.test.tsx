import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AsyncState } from '@/src/components/ui/async-state'
import { renderWithProviders } from '@/src/test/render'

describe('AsyncState', () => {
  it('renders the default loading title and description', () => {
    renderWithProviders(
      <AsyncState isLoading>
        <div>Conteúdo pronto</div>
      </AsyncState>,
    )

    expect(screen.getByText('Carregando dados')).toBeInTheDocument()
    expect(screen.getByText('Preparando as informações desta área.')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo pronto')).not.toBeInTheDocument()
  })

  it('renders the error state with the provided action', () => {
    renderWithProviders(
      <AsyncState
        isLoading={false}
        error="Falha ao carregar"
        errorAction={<button type="button">Tentar novamente</button>}
      >
        <div>Conteúdo pronto</div>
      </AsyncState>,
    )

    expect(screen.getByText('Não foi possível carregar os dados')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo pronto')).not.toBeInTheDocument()
  })
})
