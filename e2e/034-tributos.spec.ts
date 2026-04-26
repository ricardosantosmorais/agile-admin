import { expect, test } from '@playwright/test'
import { openFirstFilteredRowForEdit, openPriceStockModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens taxes list and reaches the edit form when rows are available', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /^tributos|taxes$/i,
    urlPattern: /\/tributos(?:\?|$)/,
    path: '/tributos',
  })

  const firstRow = page.locator('tbody tr').first()
  await expect(firstRow).toBeVisible({ timeout: 30_000 })
  await openFirstFilteredRowForEdit(page, /\/tributos\/[^/]+\/editar$/)
  await expect(page.getByRole('heading', { name: /dados gerais|general data/i })).toBeVisible({ timeout: 30_000 })
})
