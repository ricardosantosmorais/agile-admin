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

function formNumberInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="number"]').nth(index)
}

async function openList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName: /leve e pague|buy x pay y/i,
    urlPattern: /\/leve-e-pague(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates a buy x pay y campaign, loads tabs and deletes it', async ({ page }) => {
  const uniqueCode = `LP-${Date.now()}`
  const uniqueName = `Leve Pague ${uniqueCode}`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/leve-e-pague\/novo$/)

  await formTextInput(page, 0).fill(uniqueCode)
  await formTextInput(page, 1).fill(uniqueName)
  await formNumberInput(page, 0).fill('4')
  await formNumberInput(page, 1).fill('2')
  await formNumberInput(page, 2).fill('8')
  await formDateInput(page, 0).fill('2026-03-24')
  await formDateInput(page, 1).fill('2026-03-31')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/leve-e-pague\/[^/]+\/editar$/, { timeout: 60_000 })

  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto foi vinculado à campanha|no products have been linked to the campaign/i)).toBeVisible({ timeout: 30_000 })

  await openList(page)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await savedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
