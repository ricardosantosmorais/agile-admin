import { expect, test } from '@playwright/test';
import { waitForProtectedShell } from '@/e2e/helpers/auth';

test.describe('Integrações > Login Social', () => {
	test('carrega configurações e salva alteração do Google', async ({ page }) => {
		test.setTimeout(120_000);

		let postedBody: unknown = null;

		await page.route('**/api/integracoes/login-social', async (route, request) => {
			if (request.method() === 'GET') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						parameters: {
							data: [
								{ chave: 'url_site', parametros: 'https://loja.test/' },
								{ chave: 'g_id_aplicacao', parametros: 'google-id', created_at: '2026-04-11 10:00:00', usuario: { nome: 'Admin Master' } },
								{ chave: 'g_senha_aplicacao', parametros: '***google-secret***' },
								{ chave: 'fb_id_aplicacao', parametros: 'facebook-id' },
								{ chave: 'fb_senha_aplicacao', parametros: '***facebook-secret***' },
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

		await page.goto('/integracoes/login-social', {
			waitUntil: 'domcontentloaded',
			timeout: 60_000,
		});

		await waitForProtectedShell(page);
		await expect(page).toHaveURL(/\/integracoes\/login-social(?:\?|$)/);
		await expect(page.getByRole('heading', { name: /login social|social login/i })).toBeVisible();
		await expect(page.getByText('https://loja.test/components/social-login.php')).toBeVisible();

		const applicationIdInput = page.getByLabel(/ID da Aplicação|Application ID/i).first();
		await applicationIdInput.fill('google-id-updated');
		await page
			.getByRole('button', { name: /salvar|save/i })
			.first()
			.click();

		await expect.poll(() => postedBody).not.toBeNull();

		const payload = postedBody as {
			parameters?: Array<{ chave?: string; parametros?: string }>;
		};

		expect(payload.parameters?.some((item) => item.chave === 'g_id_aplicacao' && item.parametros === 'google-id-updated')).toBe(true);
		expect(payload.parameters?.some((item) => item.chave === 'g_senha_aplicacao')).toBe(false);
		expect(payload.parameters?.some((item) => item.chave === 'url_site')).toBe(false);
	});
});
