import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { renderWithProviders } from '@/src/test/render'

describe('LookupSelect', () => {
  it('renders the dropdown in a portal so parent overflow does not clip the options', async () => {
    const loadOptions = vi.fn().mockResolvedValue([
      { id: '1', label: 'Canal 1' },
      { id: '2', label: 'Canal 2' },
    ])

    const { container } = renderWithProviders(
      <div style={{ maxHeight: '40px', overflow: 'auto' }}>
        <LookupSelect label="Canal" value={null} onChange={() => undefined} loadOptions={loadOptions} />
      </div>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: /selecione canal/i }).at(-1)!)

    const option = await screen.findByText('Canal 1')
    expect(option).toBeInTheDocument()
    expect(container).not.toContainElement(option)
    expect(document.body).toContainElement(option)

    await waitFor(() => {
      expect(loadOptions).toHaveBeenCalledWith('', 1, 15)
    })
  })

  it('keeps the dropdown above shared modals', async () => {
    const loadOptions = vi.fn().mockResolvedValue([{ id: '1', label: 'Canal 1' }])

    renderWithProviders(
      <OverlayModal open title="Modal de teste" onClose={() => undefined}>
        <LookupSelect label="Canal" value={null} onChange={() => undefined} loadOptions={loadOptions} />
      </OverlayModal>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: /selecione canal/i }).at(-1)!)

    const option = await screen.findByText('Canal 1')
    const dropdown = option.closest('.fixed')

    expect(dropdown).toHaveClass('z-[240]')
  })
})
