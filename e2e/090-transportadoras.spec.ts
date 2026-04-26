import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openLogisticsModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes carriers through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `TRA-${suffix}`
  const tradeName = `Transportadora E2E ${suffix}`
  const companyName = `Transportadora Razao ${suffix}`
  const contactName = `Contato ${suffix}`

  await openLogisticsModule(page, {
    linkName: /^transportadoras|carriers$/i,
    urlPattern: /\/transportadoras(?:\?|$)/,
    path: '/transportadoras',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await page.getByRole('combobox').first().selectOption('PJ')
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^cnpj$/i).fill('01125797000701')
  await fieldInput(page, /^nome fantasia|trade name$/i).fill(tradeName)
  await fieldInput(page, /^raz[aã]o social|company name$/i).fill(companyName)
  await fieldInput(page, /^pessoa de contato|contact person$/i).fill(contactName)
  await fieldInput(page, /^e-mail$/i).fill(`transportadora.${suffix}@example.com`)
  await fieldInput(page, /^cep$/i).fill('02190005')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/transportadoras(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await expect(page.locator('tbody tr').first()).toContainText(tradeName, { timeout: 30_000 })

  await openFirstFilteredRowForEdit(page, /\/transportadoras\/[^/]+\/editar$/)
  await fieldInput(page, /^pessoa de contato|contact person$/i).fill(`${contactName} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/transportadoras(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await expect(page.locator('tbody tr').first()).toContainText(tradeName, { timeout: 30_000 })
  await deleteFirstFilteredRow(page)
})
