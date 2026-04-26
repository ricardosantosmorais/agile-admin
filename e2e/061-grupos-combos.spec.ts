import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'
import { filterByCode, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(90_000)

async function openList(page: Parameters<typeof waitForProtectedShell>[0]) {
  await page.goto('/grupos-de-combos', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 15_000 })
}

test('lists, creates, filters and deletes a combo group through the UI', async ({ page }) => {
  const uniqueCode = `GRC-${Date.now()}`
  const uniqueName = `Grupo E2E ${uniqueCode}`

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

  await savedRow.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
