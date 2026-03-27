import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openLogisticsModule, pickLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes coverage areas through the UI', async ({ page }) => {
  const suffix = Date.now()
  const routeCode = `ROT-${suffix}`
  const routeName = `Rota Base ${suffix}`
  const marketAreaCode = `PRA-${suffix}`
  const marketAreaName = `Praça Base ${suffix}`
  const code = `AREA-${suffix}`
  const name = `Área E2E ${suffix}`

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
  await fieldInput(page, /^c[oó]digo$/i).fill(marketAreaCode)
  await fieldInput(page, /^nome$/i).fill(marketAreaName)
  await fieldInput(page, /^cep inicial|zip start$/i).fill('60000-000')
  await fieldInput(page, /^cep final|zip end$/i).fill('60199-999')
  await expect(fieldInput(page, /^nome$/i)).toHaveValue(marketAreaName)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/pracas(?:\?|$)/, { timeout: 30_000 })

  await openLogisticsModule(page, {
    linkName: /^áreas de atuação|areas de atuacao|coverage areas$/i,
    urlPattern: /\/areas-de-atuacao(?:\?|$)/,
    path: '/areas-de-atuacao',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await pickLookupOption(page, /^praça|market area$/i, /praça base|pra-/i)
  await fieldInput(page, /^cep inicial|zip start$/i).fill('60000-000')
  await fieldInput(page, /^cep final|zip end$/i).fill('60199-999')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/areas-de-atuacao(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/areas-de-atuacao\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/areas-de-atuacao(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)

  await openLogisticsModule(page, {
    linkName: /^pr[aá]ças|market areas$/i,
    urlPattern: /\/pracas(?:\?|$)/,
    path: '/pracas',
  })
  await filterByCode(page, marketAreaCode)
  await deleteFirstFilteredRow(page)

  await openLogisticsModule(page, {
    linkName: /^rotas|routes$/i,
    urlPattern: /\/rotas(?:\?|$)/,
    path: '/rotas',
  })
  await filterByCode(page, routeCode)
  await deleteFirstFilteredRow(page)
})
