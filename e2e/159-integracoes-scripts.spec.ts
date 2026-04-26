import { expect, test } from '@playwright/test';
import { waitForProtectedShell } from '@/e2e/helpers/auth';

test.describe('Integrações > Scripts', () => {
	test('carrega scripts e salva alteração no head', async ({ page }) => {
		test.setTimeout(120_000);

		let postedBody: unknown = null;

		await page.route('**/api/integracoes/scripts', async (route, request) => {
			if (request.method() === 'GET') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						parameters: {
							data: [
								{ chave: 'head_js', parametros: '<script>window.headTag = true;</script>', created_at: '2026-04-11 13:00:00', usuario: { nome: 'Admin Master' } },
								{ chave: 'footer_js', parametros: '<script>window.footerTag = true;</script>' },
							],
						},
					}),
				});
				return;
			}

			postedBody = request.postDataJSON();
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true }),
			});
		});

		await page.goto('/integracoes/scripts', {
			waitUntil: 'domcontentloaded',
			timeout: 60_000,
		});

		await waitForProtectedShell(page);
		await expect(page).toHaveURL(/\/integracoes\/scripts(?:\?|$)/);
		await expect(page.getByRole('button', { name: /head/i })).toBeVisible();

		await page.locator('.monaco-editor .view-lines').first().click();
		await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
		await page.keyboard.insertText('<script>window.headTag = "updated";</script>');
		await page
			.getByRole('button', { name: /salvar|save/i })
			.first()
			.click();

		await expect.poll(() => postedBody).not.toBeNull();

		const payload = postedBody as {
			parameters?: Array<{ chave?: string; parametros?: string }>;
		};

		expect(payload.parameters?.some((item) => item.chave === 'head_js' && item.parametros?.includes('updated'))).toBe(true);
		expect(payload.parameters?.some((item) => item.chave === 'footer_js' && item.parametros === '<script>window.footerTag = true;</script>')).toBe(true);
	});
});
