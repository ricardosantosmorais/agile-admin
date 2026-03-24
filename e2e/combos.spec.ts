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

function formNumberInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="number"]').nth(index)
}

async function openCombosList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName: /^combos$/i,
    urlPattern: /\/combos(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates a combo, shows it in the list and deletes it from the table', async ({ page }) => {
  const uniqueCode = `CMB-${Date.now()}`
  const uniqueName = `Combo E2E ${uniqueCode}`

  await openCombosList(page)

  await page.getByRole('link', { name: /novo/i }).click()
  await expect(page).toHaveURL(/\/combos\/novo$/, { timeout: 60_000 })
  await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeVisible({ timeout: 60_000 })

  await formTextInput(page, 0).fill(uniqueCode)
  await formTextInput(page, 1).fill(uniqueName)
  await formSelect(page, 0).selectOption('faixa_quantidade')
  await formSelect(page, 1).selectOption('preco_base')
  await formDateInput(page, 0).fill('2026-03-23')
  await formDateInput(page, 1).fill('2026-03-30')
  await formNumberInput(page, 0).fill('2')

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/combos\/[^/]+\/editar$/, { timeout: 60_000 })

  const match = page.url().match(/\/combos\/([^/]+)\/editar$/)
  const savedId = match?.[1] ?? null
  expect(savedId).not.toBeNull()

  await expect(formTextInput(page, 0)).toHaveValue(uniqueCode)
  await expect(formTextInput(page, 1)).toHaveValue(uniqueName)

  await page.getByRole('button', { name: /^produtos$/i }).click()
  await expect(page.getByText(/nenhum produto foi vinculado ao combo/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/não foi possível carregar os produtos do combo/i)).toHaveCount(0)

  await page.getByRole('button', { name: /exceções|excecoes/i }).click()
  await expect(page.getByText(/nenhuma exceção foi cadastrada para o combo/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/não foi possível carregar as exceções do combo/i)).toHaveCount(0)

  await openCombosList(page)

  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await expect(savedRow).toContainText(uniqueName)

  await savedRow.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()

  await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
})
