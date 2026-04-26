import { expect, test } from '@playwright/test'
import { ensureAgileTenantByUi, expectAccessDenied, isAccessDenied, waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('opens the ERP scripts list and new form @agile', async ({ page }) => {
	await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
	await waitForProtectedShell(page)
	await ensureAgileTenantByUi(page)

	await page.goto('/integracao-com-erp/cadastros/scripts', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/scripts(?:\?|$)/, { timeout: 60_000 })
	if (await isAccessDenied(page)) {
		await expectAccessDenied(page)
		return
	}
	await expect(page.getByRole('link', { name: /novo|new/i })).toBeVisible()

	await page.getByRole('link', { name: /novo|new/i }).click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/scripts\/novo$/, { timeout: 30_000 })
	await expect(page.getByRole('heading', { name: /dados do script/i })).toBeVisible()
	await expect(page.getByText(/nome\*/i)).toBeVisible()
	await expect(page.getByText(/script\*/i)).toBeVisible()
})
