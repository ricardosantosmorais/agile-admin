import { expect, test } from '@playwright/test'

test.setTimeout(120_000)

test('shows content files list and opens upload modal', async ({ page }) => {
	await page.route('**/api/arquivos**', async (route) => {
		if (route.request().method() !== 'GET') {
			await route.continue()
			return
		}

		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				data: [],
				meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 15 },
			}),
		})
	})

	await page.goto('/conteudo/arquivos')
	await expect(page.getByText(/arquivos|files/i).first()).toBeVisible()
	await page.getByRole('button', { name: /enviar arquivo|upload file/i }).click()
	await expect(page.getByText(/enviar arquivo|upload file/i).last()).toBeVisible()
})
