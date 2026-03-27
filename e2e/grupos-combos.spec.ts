import { expect, test } from '@playwright/test'
import { filterByCode, openPromotionsModule, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(120_000)

async function openList(page: Parameters<typeof openPromotionsModule>[0]) {
  await openPromotionsModule(page, {
    linkName: /grupos de combos|combo groups/i,
    urlPattern: /\/grupos-de-combos(?:\?|$)/,
    path: '/grupos-de-combos',
  })
}

test('creates, filters, edits and deletes a combo group through the UI', async ({ page }) => {
  const uniqueCode = `GRC-${Date.now()}`
  const uniqueName = `Grupo E2E ${uniqueCode}`
  const editedName = `${uniqueName} Editado`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/grupos-de-combos\/novo$/, { timeout: 60_000 })

  await textInputAt(page, 0).fill(uniqueCode)
  await textInputAt(page, 1).fill(uniqueName)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/grupos-de-combos(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, uniqueCode)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toContainText(uniqueName)

  await savedRow.locator('a').first().click()
  await expect(page).toHaveURL(/\/grupos-de-combos\/[^/]+\/editar$/, { timeout: 30_000 })
  await textInputAt(page, 1).fill(editedName)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/grupos-de-combos(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, uniqueCode)
  const rowToDelete = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(rowToDelete).toContainText(editedName)
  await rowToDelete.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
