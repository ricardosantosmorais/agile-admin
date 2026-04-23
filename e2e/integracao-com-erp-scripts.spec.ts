import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('opens the ERP scripts list and new form', async ({ page }) => {
	await page.goto('/integracao-com-erp/cadastros/scripts', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/scripts(?:\?|$)/, { timeout: 60_000 })
	await expect(page.getByRole('link', { name: /novo|new/i })).toBeVisible()

	await page.getByRole('link', { name: /novo|new/i }).click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/scripts\/novo$/, { timeout: 30_000 })
	await expect(page.getByRole('button', { name: /dados gerais/i })).toBeVisible()
	await expect(page.getByRole('button', { name: /^script$/i })).toBeVisible()
})
