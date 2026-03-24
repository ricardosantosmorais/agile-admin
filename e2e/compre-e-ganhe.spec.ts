import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function formTextInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="text"]').nth(index)
}

function formSelect(page: Page, index: number): Locator {
  return formRoot(page).locator('select').nth(index)
}

function formDateInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="date"]').nth(index)
}

async function openList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName: /compre e ganhe|buy and get/i,
    urlPattern: /\/compre-e-ganhe(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates a buy and get campaign, loads all tabs and deletes it', async ({ page }) => {
  const uniqueCode = `CG-${Date.now()}`
  const uniqueName = `Compre e Ganhe ${uniqueCode}`

  await openList(page)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/compre-e-ganhe\/novo$/)

  await formTextInput(page, 0).fill(uniqueCode)
  await formTextInput(page, 1).fill(uniqueName)
  await formSelect(page, 0).selectOption('todos')
  await formDateInput(page, 0).fill('2026-03-24')
  await formDateInput(page, 1).fill('2026-03-31')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/compre-e-ganhe\/[^/]+\/editar$/, { timeout: 60_000 })

  await page.getByRole('button', { name: /^regras$|^rules$/i }).click()
  await expect(page.getByText(/nenhuma regra cadastrada|no rules created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /^produtos$|^products$/i }).click()
  await expect(page.getByText(/nenhum produto cadastrado|no products created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /exceções|excecoes|exceptions/i }).click()
  await expect(page.getByText(/nenhuma exceção cadastrada|no exceptions created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /restrições|restricoes|restrictions/i }).click()
  await expect(page.getByText(/nenhuma restrição cadastrada|no restrictions created/i)).toBeVisible({ timeout: 30_000 })

  await openList(page)
  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await savedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
