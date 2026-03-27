import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, openFirstFilteredRowForEdit, openPriceStockModule, pickFirstLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes tax sharing through the UI', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /tributos x partilha|taxes x sharing/i,
    urlPattern: /\/tributos-partilha(?:\?|$)/,
    path: '/tributos-partilha',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await pickFirstLookupOption(page, /^produto|product$/i)
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('SP')
  await page.getByRole('combobox', { name: /tipo c[aá]lculo|calculation type/i }).selectOption('base_unica')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/tributos-partilha(?:\?|$)/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('SP')
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await openFirstFilteredRowForEdit(page, /\/tributos-partilha\/[^/]+\/editar$/)
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('RJ')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/tributos-partilha(?:\?|$)/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('combobox', { name: /^uf|state$/i }).selectOption('RJ')
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await deleteFirstFilteredRow(page)
})
