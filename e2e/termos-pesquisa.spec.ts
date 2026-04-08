import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, ensureFiltersVisible, fieldInput, openCrudModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes search terms through the UI', async ({ page }) => {
  const suffix = Date.now()
  const terms = `cimento, argamassa ${suffix}`
  const result = `cimento argamassa ${suffix}`
  const editedResult = `${result} editado`

  await openCrudModule(page, {
    parents: [/manutenção|manutencao|maintenance/i],
    linkName: /^termos de pesquisa|search terms$/i,
    urlPattern: /\/termos-de-pesquisa(?:\?|$)/,
    path: '/termos-de-pesquisa',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^termos de pesquisa|search terms$/i).fill(terms)
  await fieldInput(page, /^resultado de busca|search result$/i).fill(result)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/termos-de-pesquisa(?:\?|$)/, { timeout: 30_000 })

  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^termos de pesquisa|search terms$/i }).fill(terms)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(result, { timeout: 30_000 })

  await openFirstFilteredRowForEdit(page, /\/termos-de-pesquisa\/[^/]+\/editar$/)
  await fieldInput(page, /^resultado de busca|search result$/i).fill(editedResult)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/termos-de-pesquisa(?:\?|$)/, { timeout: 30_000 })

  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^termos de pesquisa|search terms$/i }).fill(terms)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(editedResult, { timeout: 30_000 })
  await deleteFirstFilteredRow(page)
})

