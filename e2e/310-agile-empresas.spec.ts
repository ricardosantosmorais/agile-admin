import { test } from '@playwright/test'
import { ensureAgileTenantByUi, openModuleFromMenu, waitForProtectedShell } from '@/e2e/helpers/auth'

test('opens companies from the Agile menu @agile', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await ensureAgileTenantByUi(page)

  await openModuleFromMenu(page, {
    linkName: /^empresas|companies$/i,
    urlPattern: /\/empresas(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
})
