import { expect, test } from '@playwright/test'
import { ensureAgileTenantByUi, expectAccessDenied, isAccessDenied, waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('opens endpoints CRUD and validates the create form @agile', async ({ page }) => {
	await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
	await waitForProtectedShell(page)
	await ensureAgileTenantByUi(page)

	await page.goto('/integracao-com-erp/cadastros/endpoints', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/endpoints(?:\?|$)/, { timeout: 60_000 })
	if (await isAccessDenied(page)) {
		await expectAccessDenied(page)
		return
	}

	await expect(page.getByRole('link', { name: /novo|new/i })).toBeVisible()
	await page.getByRole('link', { name: /novo|new/i }).click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/endpoints\/novo$/, { timeout: 30_000 })
	await expect(page.getByText(/dados gerais/i)).toBeVisible()
	await expect(page.getByText(/^Nome\*?$/i)).toBeVisible()
	await expect(page.getByText(/tipo de retorno|return type/i)).toBeVisible()
	await expect(page.locator('main input').first()).toBeVisible()
	await expect(page.locator('main select').first()).toBeVisible()
})
