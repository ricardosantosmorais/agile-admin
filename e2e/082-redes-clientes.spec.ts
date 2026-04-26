import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes customer networks through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `RED-${suffix}`
  const name = `Rede E2E ${suffix}`

  await openPeopleModule(page, {
    linkName: /^redes de clientes?|customer networks?$/i,
    urlPattern: /\/redes-clientes(?:\?|$)/,
    path: '/redes-clientes',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo|code$/i).fill(code)
  await fieldInput(page, /^nome|name$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/redes-clientes(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/redes-clientes\/[^/]+\/editar$/)
  await fieldInput(page, /^nome|name$/i).fill(`${name} Editada`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/redes-clientes(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
