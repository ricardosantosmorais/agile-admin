import { expect, test } from '@playwright/test'
import {
  deleteFirstFilteredRow,
  fieldInput,
  filterByCode,
  openFinancialModule,
  openFirstFilteredRowForEdit,
  selectAt,
} from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, validates tabs and deletes payment methods through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `FP-${suffix}`
  const name = `Forma E2E ${suffix}`

  await openFinancialModule(page, {
    linkName: /^formas de pagamento|payment methods$/i,
    urlPattern: /\/formas-de-pagamento(?:\?|$)/,
    path: '/formas-de-pagamento',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await selectAt(page, 0).selectOption('cliente')
  await selectAt(page, 1).selectOption('pix')
  await fieldInput(page, /^nome$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/formas-de-pagamento\/[^/]+\/editar$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /condi[cç][õo]es de pagamento|payment terms/i }).click()
  await expect(page.getByText(/nenhuma condi[cç][ãa]o vinculada|no linked payment terms/i)).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: /restri[cç][õo]es|restrictions/i }).click()
  await expect(page.getByText(/nenhum registro foi encontrado|no records were found/i)).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: /exce[cç][õo]es|exceptions/i }).click()
  await expect(page.getByText(/nenhum registro foi encontrado|no records were found/i)).toBeVisible({ timeout: 30_000 })

  await openFinancialModule(page, {
    linkName: /^formas de pagamento|payment methods$/i,
    urlPattern: /\/formas-de-pagamento(?:\?|$)/,
    path: '/formas-de-pagamento',
  })
  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/formas-de-pagamento\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editada`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/formas-de-pagamento(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
