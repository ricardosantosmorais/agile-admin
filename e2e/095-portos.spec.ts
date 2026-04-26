import { expect, test } from '@playwright/test'
import { deleteFirstFilteredRow, fieldInput, filterByCode, isModuleUnavailable, openLogisticsModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('creates, filters and deletes ports through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `POR-${suffix}`
  const name = `Porto E2E ${suffix}`

  await openLogisticsModule(page, {
    linkName: /^portos|ports$/i,
    urlPattern: /\/portos(?:\?|$)/,
    path: '/portos',
  })

  test.skip(await isModuleUnavailable(page), 'Current tenant does not expose the ports resource.')

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/portos(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
