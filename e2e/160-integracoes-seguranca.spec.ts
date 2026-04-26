import { expect, test } from '@playwright/test';
import { waitForProtectedShell } from '@/e2e/helpers/auth';

test.describe('Integrações > Segurança', () => {
	test('carrega parâmetros de reCAPTCHA e salva alteração da chave v3', async ({ page }) => {
		test.setTimeout(120_000);

		let postedBody: unknown = null;

		await page.route('**/api/integracoes/seguranca', async (route, request) => {
			if (request.method() === 'GET') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						parameters: {
							data: [
								{ chave: 'recaptcha_v3_key', parametros: 'v3-site-key', created_at: '2026-04-11 12:00:00', usuario: { nome: 'Admin Master' } },
								{ chave: 'recaptcha_v3_secret', parametros: 'v3-secret' },
								{ chave: 'recaptcha_v2_key', parametros: 'v2-site-key' },
								{ chave: 'recaptcha_v2_secret', parametros: 'v2-secret' },
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

		await page.goto('/integracoes/seguranca', {
			waitUntil: 'domcontentloaded',
			timeout: 60_000,
		});

		await waitForProtectedShell(page);
		await expect(page).toHaveURL(/\/integracoes\/seguranca(?:\?|$)/);
		await expect(page.getByRole('heading', { name: /reCAPTCHA V3/i })).toBeVisible();

		await page.locator('main input').nth(1).fill('v3-site-key-updated');
		await page
			.getByRole('button', { name: /salvar|save/i })
			.first()
			.click();

		await expect.poll(() => postedBody).not.toBeNull();

		const payload = postedBody as {
			parameters?: Array<{ chave?: string; parametros?: string }>;
		};

		expect(payload.parameters?.some((item) => item.chave === 'recaptcha_v3_key' && item.parametros === 'v3-site-key-updated')).toBe(true);
		expect(payload.parameters?.some((item) => item.chave === 'recaptcha_v3_secret')).toBe(false);
	});
});
