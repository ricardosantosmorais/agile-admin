import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, formRoot, openCatalogModule, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'

test.setTimeout(240_000)

test('creates, opens tabs, edits and deletes products through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `PROD-${suffix}`
  const name = `Produto E2E ${suffix}`

  await openCatalogModule(page, {
    linkName: /^produtos|products$/i,
    urlPattern: /\/produtos(?:\?|$)/,
    path: '/produtos',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()

  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldRowSelect(page, /^tipo$/i).selectOption('venda')
  await fieldRowSelect(page, /^status$/i).selectOption('disponivel')
  await fieldInput(page, /^nome$/i).fill(name)

  await formRoot(page).getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page).toHaveURL(/\/produtos\/[^/]+\/editar$/, { timeout: 30_000 })

  for (const tabName of [
    /classifica[cç][aã]o|classification/i,
    /conte[úu]do|content/i,
    /estoque e log[ií]stica|stock and logistics/i,
    /filiais|branches/i,
    /embalagens|packages/i,
    /^seo$/i,
    /promo[cç][aã]o|promotion/i,
    /grades e cores|grades and colors/i,
    /relacionados|related/i,
    /imagens|images/i,
  ]) {
    await formRoot(page).getByRole('button', { name: tabName }).first().click()
    await expect(formRoot(page)).toBeVisible()
  }

  await formRoot(page).getByRole('button', { name: /dados gerais|general data/i }).first().click()
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await formRoot(page).getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page).toHaveURL(/\/produtos(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/produtos\/[^/]+\/editar$/)
  await expect(fieldInput(page, /^nome$/i)).toHaveValue(`${name} Editado`)

  await page.goto('/produtos', { waitUntil: 'domcontentloaded' })
  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})

function fieldRowSelect(page: Parameters<typeof fieldInput>[0], label: RegExp) {
  return formRoot(page)
    .getByText(label, { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class,"grid")][1]')
    .locator('select')
    .first()
}
