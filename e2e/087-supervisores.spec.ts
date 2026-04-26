import { expect, test } from '@playwright/test'
import { openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens supervisors list and reaches the edit form when rows are available', async ({ page }) => {
  await openPeopleModule(page, {
    linkName: /^supervisores|supervisors$/i,
    urlPattern: /\/supervisores(?:\?|$)/,
    path: '/supervisores',
  })

  const supervisorRow = page.locator('tbody tr').first()
  if ((await supervisorRow.count()) === 0) {
    return
  }

  await supervisorRow.locator('a').first().click()
  await expect(page).toHaveURL(/\/supervisores\/[^/]+\/editar$/, { timeout: 30_000 })
  await expect(page.getByText(/dados principais|main data/i).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('form, main').getByText(/nome|name/i).first()).toBeVisible({ timeout: 30_000 })
})
