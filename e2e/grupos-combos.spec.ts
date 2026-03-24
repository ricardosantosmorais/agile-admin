import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function formTextInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="text"]').nth(index)
}

async function openList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName: /grupos de combos|combo groups/i,
    urlPattern: /\/grupos-de-combos(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates a combo group and deletes it from the list', async ({ page }) => {
  const uniqueCode = `GRC-${Date.now()}`
  const uniqueName = `Grupo E2E ${uniqueCode}`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/grupos-de-combos\/novo$/)

  await formTextInput(page, 0).fill(uniqueCode)
  await formTextInput(page, 1).fill(uniqueName)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/grupos-de-combos(?:\?|$)/, { timeout: 60_000 })

  await openList(page)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await expect(savedRow).toContainText(uniqueName)
  await savedRow.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
