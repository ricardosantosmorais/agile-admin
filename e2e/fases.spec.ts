import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openBasicRecordsModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes phases through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `FAS-${suffix}`
  const name = `Fase E2E ${suffix}`

  await openBasicRecordsModule(page, {
    linkName: /^fases|phases$/i,
    urlPattern: /\/fases(?:\?|$)/,
    path: '/fases',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await fieldInput(page, /^posição|position$/i).fill('1')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/fases(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/fases\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editada`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/fases(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
