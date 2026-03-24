import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BannerUrlsTab } from '@/src/features/banners/components/banner-urls-tab'
import { renderWithProviders } from '@/src/test/render'

const listAvailableUrls = vi.fn()
const saveUrls = vi.fn()

vi.mock('@/src/features/banners/services/banners-client', () => ({
  bannersClient: {
    listAvailableUrls: (...args: unknown[]) => listAvailableUrls(...args),
    saveUrls: (...args: unknown[]) => saveUrls(...args),
  },
}))

describe('BannerUrlsTab', () => {
  beforeEach(() => {
    listAvailableUrls.mockReset()
    saveUrls.mockReset()
  })

  it('loads the available company urls and saves the selected rows', async () => {
    listAvailableUrls.mockResolvedValue({
      data: [
        { url: 'https://tenant.local/ofertas' },
        { url: 'https://tenant.local/campanhas' },
      ],
    })
    saveUrls.mockResolvedValue({ success: true })

    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const onError = vi.fn()

    renderWithProviders(
      <BannerUrlsTab
        entityId="10"
        readOnly={false}
        form={{ urls: [{ url: 'https://tenant.local/ofertas' }] }}
        onRefresh={onRefresh}
        onError={onError}
      />,
    )

    expect(await screen.findByText('https://tenant.local/ofertas')).toBeInTheDocument()
    expect(screen.getByText('https://tenant.local/campanhas')).toBeInTheDocument()

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]).toBeChecked()
    expect(checkboxes[2]).not.toBeChecked()

    fireEvent.click(checkboxes[2])
    fireEvent.click(screen.getByRole('button', { name: /salvar|save/i }))

    await waitFor(() => {
      expect(saveUrls).toHaveBeenCalledWith('10', [
        'https://tenant.local/ofertas',
        'https://tenant.local/campanhas',
      ])
    })

    expect(onRefresh).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(null)
  })
})
