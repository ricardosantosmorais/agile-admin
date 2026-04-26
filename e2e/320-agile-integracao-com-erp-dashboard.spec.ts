import { test } from '@playwright/test'
import { ensureAgileTenantByUi, openModuleFromMenu, waitForProtectedShell } from '@/e2e/helpers/auth'

test('opens ERP dashboard from the Agile menu @agile', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await ensureAgileTenantByUi(page)

  await openModuleFromMenu(page, {
    parents: [/integra..o com erp|erp integration/i],
    linkName: /^dashboard$/i,
    urlPattern: /\/integracao-com-erp\/dashboard(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
})
