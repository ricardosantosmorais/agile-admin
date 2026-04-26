import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes customer segments through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `SEG-${suffix}`
  const name = `Segmento E2E ${suffix}`

  await openPeopleModule(page, {
    linkName: /^segmentos de clientes?|customer segments?$/i,
    urlPattern: /\/segmentos-clientes(?:\?|$)/,
    path: '/segmentos-clientes',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo|code$/i).fill(code)
  await fieldInput(page, /^nome|name$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/segmentos-clientes(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/segmentos-clientes\/[^/]+\/editar$/)
  await fieldInput(page, /^nome|name$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/segmentos-clientes(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
