import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFinancialModule } from '@/e2e/helpers/crud'

test.setTimeout(240_000)

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
  await page.getByRole('combobox', { name: /^perfil|profile$/i }).selectOption('cliente')
  await page.getByRole('combobox', { name: /^tipo$/i }).selectOption('pix')
  await fieldInput(page, /^nome$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/formas-de-pagamento\/[^/]+\/editar$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /condi[cç][õo]es de pagamento|payment terms/i }).click()
  await expect(page.getByText(/nenhuma condi[cç][ãa]o vinculada|no linked payment terms/i)).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: /restri[cç][õo]es|restrictions/i }).click()
  await expect(page.getByText(/nenhum registro foi encontrado|no records were found/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /incluir|novo|add|new/i }).click()
  await page.getByRole('combobox', { name: /^tipo$/i }).last().selectOption('todos')
  await page.getByRole('textbox', { name: /data início|start date/i }).fill('2026-04-01')
  await page.getByRole('textbox', { name: /data fim|end date/i }).fill('2026-04-30')
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page.locator('tbody tr').filter({ hasText: /todos|all/i }).first()).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: /exce[cç][õo]es|exceptions/i }).click()
  await expect(page.getByText(/nenhum registro foi encontrado|no records were found/i)).toBeVisible({ timeout: 30_000 })

  await openFinancialModule(page, {
    linkName: /^formas de pagamento|payment methods$/i,
    urlPattern: /\/formas-de-pagamento(?:\?|$)/,
    path: '/formas-de-pagamento',
  })
  await filterByCode(page, code)
  await page.locator('tbody tr').first().locator('a').first().click()
  await expect(page).toHaveURL(/\/formas-de-pagamento\/[^/]+\/editar$/, { timeout: 30_000 })
  await fieldInput(page, /^nome$/i).fill(`${name} Editada`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/formas-de-pagamento(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
