import { expect, test } from '@playwright/test'
import { dateInputAt, filterByCode, numberInputAt, openFirstFilteredRowForEdit, openPromotionsModule, selectAt, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(120_000)

async function openCombosList(page: Parameters<typeof openPromotionsModule>[0]) {
  await openPromotionsModule(page, {
    linkName: /^combos$/i,
    urlPattern: /\/combos(?:\?|$)/,
    path: '/combos',
  })
}

test('creates, filters, edits, validates tabs and deletes a combo through the UI', async ({ page }) => {
  const uniqueCode = `CMB-${Date.now()}`
  const uniqueName = `Combo E2E ${uniqueCode}`
  const editedName = `${uniqueName} Editado`

  await openCombosList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/combos\/novo$/, { timeout: 60_000 })

  await textInputAt(page, 0).fill(uniqueCode)
  await textInputAt(page, 1).fill(uniqueName)
  await selectAt(page, 0).selectOption('faixa_quantidade')
  await selectAt(page, 1).selectOption('preco_base')
  await dateInputAt(page, 0).fill('2026-03-23')
  await dateInputAt(page, 1).fill('2026-03-30')
  await numberInputAt(page, 0).fill('2')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/combos\/[^/]+\/editar$/, { timeout: 60_000 })

  await textInputAt(page, 1).fill(editedName)
  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto foi vinculado ao combo/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /exceções|excecoes|exceptions/i }).click()
  await expect(page.getByText(/nenhuma exceção foi cadastrada para o combo/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/combos(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, uniqueCode)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toContainText(editedName)

  await openFirstFilteredRowForEdit(page, /\/combos\/[^/]+\/editar$/)
  await expect(textInputAt(page, 1)).toHaveValue(editedName)

  await openCombosList(page)
  await filterByCode(page, uniqueCode)
  const rowToDelete = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await rowToDelete.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
