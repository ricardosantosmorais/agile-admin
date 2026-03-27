import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, openFirstFilteredRowForEdit, openPriceStockModule, pickFirstLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes product branches through the UI', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /produtos x filiais|products x branches/i,
    urlPattern: /\/produtos-x-filiais(?:\?|$)/,
    path: '/produtos-x-filiais',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await page.getByRole('combobox', { name: /status/i }).selectOption('disponivel')
  await page.getByRole('combobox', { name: /tipo de pre[cç]o|price type/i }).selectOption('normal')
  await pickFirstLookupOption(page, /^produto|product$/i)
  await pickFirstLookupOption(page, /^filial|branch$/i)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/produtos-x-filiais(?:\?|$)/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('combobox', { name: /status/i }).selectOption('disponivel')
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await openFirstFilteredRowForEdit(page, /\/produtos-x-filiais\/.+\/editar$/)
  await page.getByRole('combobox', { name: /status/i }).selectOption('em_revisao')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/produtos-x-filiais(?:\?|$)/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('combobox', { name: /status/i }).selectOption('em_revisao')
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await deleteFirstFilteredRow(page)
})
