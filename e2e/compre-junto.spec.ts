import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function formTextInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="text"]').nth(index)
}

function formDateInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="date"]').nth(index)
}

async function openList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName: /compre junto|buy together/i,
    urlPattern: /\/compre-junto(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates a buy together campaign, loads products tab and deletes it', async ({ page }) => {
  const uniqueCode = `CJ-${Date.now()}`
  const uniqueName = `Compre Junto ${uniqueCode}`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/compre-junto\/novo$/)

  await formTextInput(page, 0).fill(uniqueCode)
  await formTextInput(page, 1).fill(uniqueName)
  await formDateInput(page, 0).fill('2026-03-24')
  await formDateInput(page, 1).fill('2026-03-31')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/compre-junto\/[^/]+\/editar$/, { timeout: 60_000 })

  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto foi vinculado à campanha|no products have been linked to the campaign/i)).toBeVisible({ timeout: 30_000 })

  await openList(page)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await savedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
