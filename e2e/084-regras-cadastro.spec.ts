import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, openFirstFilteredRowForEdit, openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters, edits and deletes registration rules through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `REG-${suffix}`
  const name = `Regra E2E ${suffix}`

  await openPeopleModule(page, {
    linkName: /^regras de cadastro|registration rules$/i,
    urlPattern: /\/regras-de-cadastro(?:\?|$)/,
    path: '/regras-de-cadastro',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^nome|name$/i).fill(name)
  await fieldInput(page, /^c[oó]digo|code$/i).fill(code)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/regras-de-cadastro\/[^/]+\/editar$/, { timeout: 30_000 })
  await expect(page.getByText(/relacionamentos|relationships/i).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/regras cruzadas|cross relations/i).first()).toBeVisible({ timeout: 30_000 })

  await page.goto('/regras-de-cadastro', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await expect(page).toHaveURL(/\/regras-de-cadastro(?:\?|$)/, { timeout: 30_000 })
  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/regras-de-cadastro\/[^/]+\/editar$/)
  await fieldInput(page, /^nome|name$/i).fill(`${name} Editada`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/regras-de-cadastro(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
