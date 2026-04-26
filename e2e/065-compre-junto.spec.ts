import { expect, test } from '@playwright/test'
import { dateInputAt, filterByCode, openPromotionsModule, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(120_000)

async function openList(page: Parameters<typeof openPromotionsModule>[0]) {
  await openPromotionsModule(page, {
    linkName: /compre junto|buy together/i,
    urlPattern: /\/compre-junto(?:\?|$)/,
    path: '/compre-junto',
  })
}

test('creates a buy together campaign, loads products tab and deletes it', async ({ page }) => {
  const uniqueCode = `CJ-${Date.now()}`
  const uniqueName = `Compre Junto ${uniqueCode}`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/compre-junto\/novo$/, { timeout: 30_000 })

  await textInputAt(page, 0).fill(uniqueCode)
  await textInputAt(page, 1).fill(uniqueName)
  await dateInputAt(page, 0).fill('2026-03-24')
  await dateInputAt(page, 1).fill('2026-03-31')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/compre-junto\/[^/]+\/editar$/, { timeout: 60_000 })

  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto foi vinculado à campanha|no products have been linked to the campaign/i)).toBeVisible({ timeout: 30_000 })

  await openList(page)
  await filterByCode(page, uniqueCode)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await savedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
