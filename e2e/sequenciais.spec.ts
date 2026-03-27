import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, ensureFiltersVisible, openCrudModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes sequences through the UI', async ({ page }) => {
  const sequenceValue = String(Date.now()).slice(-6)
  const editedSequenceValue = String(Number(sequenceValue) + 1)

  await openCrudModule(page, {
    parents: [/manutenção|maintenance/i],
    linkName: /^sequenciais|sequences$/i,
    urlPattern: /\/sequenciais(?:\?|$)/,
    path: '/sequenciais',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await page.getByRole('combobox').first().selectOption('TRA')
  await page.getByRole('spinbutton').first().fill(sequenceValue)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/sequenciais(?:\?|$)/, { timeout: 30_000 })

  await ensureFiltersVisible(page)
  await page.getByRole('combobox').first().selectOption('TRA')
  await page.getByRole('textbox', { name: /sequencial|sequence/i }).fill(sequenceValue)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(sequenceValue, { timeout: 30_000 })

  await openFirstFilteredRowForEdit(page, /\/sequenciais\/[^/]+\/editar$/)
  await page.getByRole('spinbutton').first().fill(editedSequenceValue)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/sequenciais(?:\?|$)/, { timeout: 30_000 })

  await ensureFiltersVisible(page)
  await page.getByRole('combobox').first().selectOption('TRA')
  await page.getByRole('textbox', { name: /sequencial|sequence/i }).fill(editedSequenceValue)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(editedSequenceValue, { timeout: 30_000 })
  await deleteFirstFilteredRow(page)
})
