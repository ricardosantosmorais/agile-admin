import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openLogisticsModule, pickLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes market areas through the UI', async ({ page }) => {
  const suffix = Date.now()
  const routeCode = `ROT-${suffix}`
  const routeName = `Rota Base ${suffix}`
  const code = `PRA-${suffix}`
  const name = `Praça E2E ${suffix}`

  await openLogisticsModule(page, {
    linkName: /^rotas|routes$/i,
    urlPattern: /\/rotas(?:\?|$)/,
    path: '/rotas',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(routeCode)
  await fieldInput(page, /^nome$/i).fill(routeName)
  await fieldInput(page, /^hor[áa]rio de corte|cutoff time$/i).fill('18:00')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/rotas(?:\?|$)/, { timeout: 30_000 })

  await openLogisticsModule(page, {
    linkName: /^pr[aá]ças|market areas$/i,
    urlPattern: /\/pracas(?:\?|$)/,
    path: '/pracas',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await pickLookupOption(page, /^rota|route$/i, /rota base|rot-/i)
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await expect(fieldInput(page, /^nome$/i)).toHaveValue(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/pracas(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/pracas\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/pracas(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)

  await openLogisticsModule(page, {
    linkName: /^rotas|routes$/i,
    urlPattern: /\/rotas(?:\?|$)/,
    path: '/rotas',
  })
  await filterByCode(page, routeCode)
  await deleteFirstFilteredRow(page)
})
