import { expect, test } from '@playwright/test'
import { dateInputAt, filterByCode, openPromotionsModule, selectAt, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(120_000)

async function openList(page: Parameters<typeof openPromotionsModule>[0]) {
  await openPromotionsModule(page, {
    linkName: /compre e ganhe|buy and get/i,
    urlPattern: /\/compre-e-ganhe(?:\?|$)/,
    path: '/compre-e-ganhe',
  })
}

test('creates, filters, edits, validates tabs and deletes a buy and get campaign through the UI', async ({ page }) => {
  const uniqueCode = `CG-${Date.now()}`
  const uniqueName = `Compre e Ganhe ${uniqueCode}`
  const editedName = `${uniqueName} Editada`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/compre-e-ganhe\/novo$/, { timeout: 60_000 })

  await textInputAt(page, 0).fill(uniqueCode)
  await textInputAt(page, 1).fill(uniqueName)
  await selectAt(page, 0).selectOption('todos')
  await dateInputAt(page, 0).fill('2026-03-24')
  await dateInputAt(page, 1).fill('2026-03-31')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/compre-e-ganhe\/[^/]+\/editar$/, { timeout: 60_000 })

  await textInputAt(page, 1).fill(editedName)
  await page.getByRole('button', { name: /^regras$|^rules$/i }).click()
  await expect(page.getByText(/nenhuma regra cadastrada|no rules created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto cadastrado|no products created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /exceções|excecoes|exceptions/i }).click()
  await expect(page.getByText(/nenhuma exceção cadastrada|no exceptions created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /restrições|restricoes|restrictions/i }).click()
  await expect(page.getByText(/nenhuma restrição cadastrada|no restrictions created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/compre-e-ganhe(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, uniqueCode)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toContainText(editedName)
  await savedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
