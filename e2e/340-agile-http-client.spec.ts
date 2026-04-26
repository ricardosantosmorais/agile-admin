import { test } from '@playwright/test'
import { ensureAgileTenantByUi, openModuleFromMenu, waitForProtectedShell } from '@/e2e/helpers/auth'

test('opens HTTP Client from the Agile tools menu @agile', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await ensureAgileTenantByUi(page)

  await openModuleFromMenu(page, {
    parents: [/ferramentas|tools/i],
    linkName: /^http client$/i,
    urlPattern: /\/ferramentas\/http-client(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /enviar|send/i }),
  })
})
