import { expect, test } from '@playwright/test'
import { openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens users list and reaches the password flow when rows are available', async ({ page }) => {
  await openPeopleModule(page, {
    linkName: /^usuarios|users$/i,
    urlPattern: /\/usuarios(?:\?|$)/,
    path: '/usuarios',
  })

  const userRow = page.locator('tbody tr').first()
  if ((await userRow.count()) === 0) {
    return
  }

  await userRow.locator('a[href*="/senha"]').first().click()
  await expect(page).toHaveURL(/\/usuarios\/[^/]+\/senha$/, { timeout: 30_000 })
  await expect(page.getByText(/nova senha|new password/i).first()).toBeVisible({ timeout: 30_000 })
})
