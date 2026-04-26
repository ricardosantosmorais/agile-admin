import { expect, test, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

async function openAvisemeList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/marketing/i],
    linkName: /avise-me|notify me/i,
    urlPattern: /\/avise-me(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

function filtersToggle(page: Page) {
  return page.getByRole('button', { name: /filtros|ocultar filtros|filters|hide filters/i }).first()
}

function applyFiltersButton(page: Page) {
  return page.getByRole('button', { name: /aplicar filtros|apply filters/i })
}

function clearFiltersButton(page: Page) {
  return page.getByRole('button', { name: /limpar|clear/i })
}

function emptyStateCell(page: Page) {
  return page.getByRole('cell', { name: /nenhuma solicitação encontrada|no requests found/i })
}

test('opens avise-me, applies filters and keeps the empty-state flow stable', async ({ page }) => {
  await openAvisemeList(page)

  await expect(emptyStateCell(page)).toBeVisible({ timeout: 30_000 })
  await expect(filtersToggle(page)).toBeVisible()

  await filtersToggle(page).click()
  await expect(page.getByText(/^Produto$/i)).toBeVisible()
  await expect(page.getByText(/^Filial$/i)).toBeVisible()
  await expect(page.getByText(/^Período$/i)).toBeVisible()

  const dateInputs = page.locator('input[type="date"]')
  await expect(dateInputs).toHaveCount(2)
  await dateInputs.nth(0).fill('2026-03-01')
  await dateInputs.nth(1).fill('2026-03-31')

  await applyFiltersButton(page).click()
  await expect(applyFiltersButton(page)).toBeHidden({ timeout: 30_000 })
  await expect(emptyStateCell(page)).toBeVisible({ timeout: 30_000 })

  await filtersToggle(page).click()
  await clearFiltersButton(page).click()
  await expect(clearFiltersButton(page)).toBeHidden({ timeout: 30_000 })
  await expect(emptyStateCell(page)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/exibindo 0 a 0 de 0 registros|showing 0 to 0 of 0 records/i)).toBeVisible()
})
