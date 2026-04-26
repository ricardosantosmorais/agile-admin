import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFinancialModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits, checks branches tab and deletes price tables through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `TP-${suffix}`
  const name = `Tabela E2E ${suffix}`

  await openFinancialModule(page, {
    linkName: /^tabelas de pre[cç]o|price tables$/i,
    urlPattern: /\/tabelas-de-preco(?:\?|$)/,
    path: '/tabelas-de-preco',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/tabelas-de-preco\/[^/]+\/editar$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filiais|branches/i }).click()
  await expect(page.getByText(/nenhuma filial vinculada|no linked branches/i)).toBeVisible({ timeout: 30_000 })

  await openFinancialModule(page, {
    linkName: /^tabelas de pre[cç]o|price tables$/i,
    urlPattern: /\/tabelas-de-preco(?:\?|$)/,
    path: '/tabelas-de-preco',
  })
  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/tabelas-de-preco\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editada`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/tabelas-de-preco(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
