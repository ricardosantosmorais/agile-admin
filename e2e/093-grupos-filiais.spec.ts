import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openBasicRecordsModule, openFirstFilteredRowForEdit, pickLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes branch groups through the UI', async ({ page }) => {
  const suffix = Date.now()
  const branchCode = `FIL-${suffix}`
  const branchName = `Filial Base ${suffix}`
  const code = `GRF-${suffix}`
  const name = `Grupo E2E ${suffix}`

  await openBasicRecordsModule(page, {
    linkName: /^filiais|branches$/i,
    urlPattern: /\/filiais(?:\?|$)/,
    path: '/filiais',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(branchCode)
  await fieldInput(page, /^nome fantasia|trade name$/i).fill(branchName)
  await fieldInput(page, /^cnpj|tax id$/i).fill('12345678000199')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/filiais(?:\?|$)/, { timeout: 30_000 })

  await openBasicRecordsModule(page, {
    linkName: /^grupos de filiais|branch groups$/i,
    urlPattern: /\/grupos-de-filiais(?:\?|$)/,
    path: '/grupos-de-filiais',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await pickLookupOption(page, /^filial padrão|default branch$/i, /filial base|fil-/i)
  await fieldInput(page, /^nome$/i).fill(name)
  await expect(fieldInput(page, /^nome$/i)).toHaveValue(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/grupos-de-filiais(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/grupos-de-filiais\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/grupos-de-filiais(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)

  await openBasicRecordsModule(page, {
    linkName: /^filiais|branches$/i,
    urlPattern: /\/filiais(?:\?|$)/,
    path: '/filiais',
  })
  await filterByCode(page, branchCode)
  await deleteFirstFilteredRow(page)
})
