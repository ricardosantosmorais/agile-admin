import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openBasicRecordsModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes branches through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `FIL-${suffix}`
  const name = `Filial E2E ${suffix}`

  await openBasicRecordsModule(page, {
    linkName: /^filiais|branches$/i,
    urlPattern: /\/filiais(?:\?|$)/,
    path: '/filiais',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome fantasia|trade name$/i).fill(name)
  await fieldInput(page, /^cnpj|tax id$/i).fill('12345678000199')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/filiais(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/filiais\/[^/]+\/editar$/)
  await fieldInput(page, /^nome fantasia|trade name$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/filiais(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
