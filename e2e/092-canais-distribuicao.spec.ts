import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openBasicRecordsModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes distribution channels through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `CDI-${suffix}`
  const name = `Canal E2E ${suffix}`

  await openBasicRecordsModule(page, {
    linkName: /^canais de distribui[cç][aã]o|distribution channels$/i,
    urlPattern: /\/canais-de-distribuicao(?:\?|$)/,
    path: '/canais-de-distribuicao',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/canais-de-distribuicao(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/canais-de-distribuicao\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/canais-de-distribuicao(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
