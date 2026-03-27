import { expect, test } from '@playwright/test'
import { dateInputAt, filterByCode, numberInputAt, openPromotionsModule, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(120_000)

async function openList(page: Parameters<typeof openPromotionsModule>[0]) {
  await openPromotionsModule(page, {
    linkName: /desconto na unidade|unit discount/i,
    urlPattern: /\/desconto-na-unidade(?:\?|$)/,
    path: '/desconto-na-unidade',
  })
}

test('creates, filters, edits, validates tabs and deletes a unit discount campaign through the UI', async ({ page }) => {
  const uniqueCode = `DU-${Date.now()}`
  const uniqueName = `Desconto ${uniqueCode}`
  const editedName = `${uniqueName} Editado`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/desconto-na-unidade\/novo$/, { timeout: 60_000 })

  await textInputAt(page, 0).fill(uniqueCode)
  await textInputAt(page, 1).fill(uniqueName)
  await numberInputAt(page, 0).fill('3')
  await textInputAt(page, 2).fill('15,50')
  await numberInputAt(page, 1).fill('10')
  await dateInputAt(page, 0).fill('2026-03-24')
  await dateInputAt(page, 1).fill('2026-03-31')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/desconto-na-unidade\/[^/]+\/editar$/, { timeout: 60_000 })

  await textInputAt(page, 1).fill(editedName)
  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto foi vinculado à campanha|no products have been linked to the campaign/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/desconto-na-unidade(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, uniqueCode)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toContainText(editedName)
  await savedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
