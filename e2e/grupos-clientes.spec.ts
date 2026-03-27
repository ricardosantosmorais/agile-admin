import { expect, test } from '@playwright/test'
import { openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens customer groups list and reaches the relation section when rows are available', async ({ page }) => {
  await openPeopleModule(page, {
    linkName: /^grupos de clientes?|customer groups?$/i,
    urlPattern: /\/grupos-clientes(?:\?|$)/,
    path: '/grupos-clientes',
  })

  const groupRow = page.locator('tbody tr').first()
  if ((await groupRow.count()) === 0) {
    return
  }

  await groupRow.locator('a').first().click()
  await expect(page).toHaveURL(/\/grupos-clientes\/[^/]+\/editar$/, { timeout: 30_000 })
  await expect(page.getByText(/clientes|customers/i).first()).toBeVisible({ timeout: 30_000 })
})
