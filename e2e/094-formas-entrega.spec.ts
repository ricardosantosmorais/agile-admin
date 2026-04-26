import { expect, test, type Locator, type Page } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(90_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function fieldRow(page: Page, label: RegExp): Locator {
  return formRoot(page)
    .getByText(label, { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class,"grid")][1]')
}

function fieldInput(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('input').first()
}

async function ensureFiltersVisible(page: Page) {
  const applyButton = page.getByRole('button', { name: /aplicar filtros|apply filters/i })
  if (await applyButton.isVisible().catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await expect(applyButton).toBeVisible({ timeout: 10_000 })
}

async function openDeliveryMethods(page: Page) {
  await page.goto('/formas-de-entrega', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 15_000 })
}

async function filterByName(page: Page, name: string) {
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^Nome$/i }).fill(name)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(name, { timeout: 15_000 })
}

test('lists, creates, filters and deletes a delivery method through the UI', async ({ page }) => {
  const name = `Entrega E2E ${Date.now()}`

  await openDeliveryMethods(page)
  await expect(page.locator('tbody')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('link', { name: /novo|new/i }).click()

  await fieldInput(page, /^Nome$/i).fill(name)
  await fieldInput(page, /^Posi..o|Position$/i).fill('10')
  await fieldInput(page, /^Prioridade|Priority$/i).fill('3')
  await fieldRow(page, /^Tipo$/i).locator('select').selectOption('retira')
  await fieldRow(page, /^Perfil de usu.rio|User profile$/i).locator('select').selectOption('cliente')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()

  await expect(page).toHaveURL(/\/formas-de-entrega\/[^/]+\/editar$/, { timeout: 30_000 })
  await openDeliveryMethods(page)
  await filterByName(page, name)
  await page.locator('tbody tr').first().locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: name })).toHaveCount(0)
})
