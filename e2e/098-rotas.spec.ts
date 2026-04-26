import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openLogisticsModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits, validates delivery days and deletes routes through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `ROT-${suffix}`
  const name = `Rota E2E ${suffix}`

  await openLogisticsModule(page, {
    linkName: /^rotas|routes$/i,
    urlPattern: /\/rotas(?:\?|$)/,
    path: '/rotas',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await fieldInput(page, /^hor[áa]rio de corte|cutoff time$/i).fill('18:00')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/rotas(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/rotas\/[^/]+\/editar$/)
  await expect(page.getByText(/dias de entrega|delivery days/i).first()).toBeVisible({ timeout: 30_000 })
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/rotas(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
