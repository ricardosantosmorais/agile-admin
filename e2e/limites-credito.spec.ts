import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldButton, fieldInput, filterByCode, openFinancialModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes credit limits through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `LCR-${suffix}`
  const name = `Limite E2E ${suffix}`

  await openFinancialModule(page, {
    linkName: /^limites de cr[eé]dito|credit limits$/i,
    urlPattern: /\/limites-de-credito(?:\?|$)/,
    path: '/limites-de-credito',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldButton(page, /^forma de entrega|delivery method$/i).click()
  await page.getByRole('button').filter({ hasText: /.+/ }).nth(1).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await fieldInput(page, /^valor do pedido|order value$/i).fill('123456')
  await fieldInput(page, /^pedidos por dia|orders per day$/i).fill('4')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/limites-de-credito(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await expect(page.locator('tbody tr').first()).toContainText(name, { timeout: 30_000 })

  await openFirstFilteredRowForEdit(page, /\/limites-de-credito\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/limites-de-credito(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
