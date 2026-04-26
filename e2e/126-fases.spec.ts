import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'
import { deleteFirstFilteredRow, fieldInput, filterByCode } from '@/e2e/helpers/crud'

test.setTimeout(90_000)

test('lists, creates, filters and deletes phases through the UI', async ({ page }) => {
  const suffix = Date.now()
  const code = `FAS-${suffix}`
  const name = `Fase E2E ${suffix}`

  await page.goto('/fases', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^c[oó]digo$/i).fill(code)
  await fieldInput(page, /^nome$/i).fill(name)
  await fieldInput(page, /^posição|position$/i).fill('1')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/fases(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await deleteFirstFilteredRow(page)
})
