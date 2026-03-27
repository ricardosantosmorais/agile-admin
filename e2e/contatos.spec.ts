import { expect, test } from '@playwright/test'
import { openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens contacts list and details modal when rows are available', async ({ page }) => {
  await openPeopleModule(page, {
    linkName: /^contatos|contacts$/i,
    urlPattern: /\/contatos(?:\?|$)/,
    path: '/contatos',
  })

  const emptyState = page.getByText(/nenhum contato encontrado|no contacts found/i)
  if (await emptyState.isVisible().catch(() => false)) {
    return
  }

  const firstActionButton = page.locator('tbody tr').locator('button[aria-haspopup="menu"]').first()
  if ((await firstActionButton.count()) === 0) {
    return
  }

  await firstActionButton.click()
  await page.getByRole('menuitem', { name: /informacoes|details|contact information/i }).click()
  await expect(page.getByRole('heading', { name: /informacoes do contato|contact information/i })).toBeVisible({ timeout: 30_000 })
})
