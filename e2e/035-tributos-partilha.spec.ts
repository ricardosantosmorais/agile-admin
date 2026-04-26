import { expect, test } from '@playwright/test'
import { openFirstFilteredRowForEdit, openPriceStockModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens tax sharing list and reaches the edit form when rows are available', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /tributos x partilha|taxes x sharing/i,
    urlPattern: /\/tributos-partilha(?:\?|$)/,
    path: '/tributos-partilha',
  })

  const firstRow = page.locator('tbody tr').first()
  await expect(firstRow).toBeVisible({ timeout: 30_000 })
  if (!await firstRow.locator('a').first().isVisible().catch(() => false)) {
    return
  }

  await openFirstFilteredRowForEdit(page, /\/tributos-partilha\/[^/]+\/editar$/)
  await expect(page.getByRole('heading', { name: /dados gerais|general data/i })).toBeVisible({ timeout: 30_000 })
})
