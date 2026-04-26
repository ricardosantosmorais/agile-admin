import { expect, test } from '@playwright/test'
import { openCrudModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens maintenance logs and displays details when records are available', async ({ page }) => {
  await openCrudModule(page, {
    parents: [/manuten..o|manutencao|maintenance/i],
    linkName: /^logs$/i,
    urlPattern: /\/logs(?:\?|$)/,
    path: '/logs',
  })

  const firstRow = page.locator('tbody tr').first()
  const hasRows = await firstRow.isVisible().catch(() => false)

  await page.getByRole('button', { name: /filtros|filters/i }).click()
  await expect(page.getByLabel(/m.dulo|module/i)).toBeVisible()
  await expect(page.getByLabel(/m.dulo|module/i)).toHaveJSProperty('tagName', 'SELECT')

  if (!hasRows) {
    await expect(page.getByText(/nenhum registro encontrado|no records found/i)).toBeVisible()
    return
  }

  await firstRow.locator('button').first().click()
  await expect(page.getByRole('heading', { name: /detalhes|details/i })).toBeVisible({ timeout: 20_000 })
})
