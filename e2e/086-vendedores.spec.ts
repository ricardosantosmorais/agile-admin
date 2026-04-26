import { expect, test } from '@playwright/test'
import { openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens sellers list and validates edit tabs when rows are available', async ({ page }) => {
  await openPeopleModule(page, {
    linkName: /^vendedores|sellers$/i,
    urlPattern: /\/vendedores(?:\?|$)/,
    path: '/vendedores',
  })

  const sellerRow = page.locator('tbody tr').first()
  if ((await sellerRow.count()) === 0) {
    return
  }

  await sellerRow.locator('a').first().click()
  await expect(page).toHaveURL(/\/vendedores\/[^/]+\/editar$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /dados gerais|general data/i }).click()
  await expect(page.getByRole('button', { name: /dados gerais|general data/i })).toBeVisible({ timeout: 30_000 })

  const channelsTab = page.getByRole('button', { name: /canais de distribuicao|distribution channels/i }).first()
  if (await channelsTab.isVisible().catch(() => false)) {
    await channelsTab.click()
    await expect(page.getByText(/canais de distribuicao|distribution channels/i).first()).toBeVisible({ timeout: 30_000 })
  }
})
