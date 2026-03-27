import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, openFirstFilteredRowForEdit, openPriceStockModule, pickFirstLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes taxes through the UI', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /^tributos|taxes$/i,
    urlPattern: /\/tributos(?:\?|$)/,
    path: '/tributos',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await pickFirstLookupOption(page, /^produto|product$/i)
  await pickFirstLookupOption(page, /^tabela de pre[cç]o|price table$/i)
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('SP')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/tributos(?:\?|$)/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('SP')
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await openFirstFilteredRowForEdit(page, /\/tributos\/[^/]+\/editar$/)
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('RJ')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/tributos(?:\?|$)/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('RJ')
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await deleteFirstFilteredRow(page)
})
