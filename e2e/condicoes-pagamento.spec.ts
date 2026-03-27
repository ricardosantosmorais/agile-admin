import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFinancialModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits, checks branches tab and deletes payment terms through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `CP-${suffix}`
  const name = `Prazo E2E ${suffix}`

  await openFinancialModule(page, {
    linkName: /^condi[cç][õo]es de pagamento|payment terms$/i,
    urlPattern: /\/condicoes-de-pagamento(?:\?|$)/,
    path: '/condicoes-de-pagamento',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await page.getByRole('spinbutton', { name: /parcelas|installments/i }).fill('3')
  await page.getByRole('spinbutton', { name: /prazo médio|average term/i }).fill('28')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/condicoes-de-pagamento\/[^/]+\/editar$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /filiais|branches/i }).click()
  await expect(page.getByText(/nenhuma filial vinculada|no linked branches/i)).toBeVisible({ timeout: 30_000 })

  await openFinancialModule(page, {
    linkName: /^condi[cç][õo]es de pagamento|payment terms$/i,
    urlPattern: /\/condicoes-de-pagamento(?:\?|$)/,
    path: '/condicoes-de-pagamento',
  })
  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/condicoes-de-pagamento\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/condicoes-de-pagamento(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
