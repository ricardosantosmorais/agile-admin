import { expect, test } from '@playwright/test';
import { waitForProtectedShell } from '@/e2e/helpers/auth';

test.describe('Integrações > Clientes', () => {
	test('carrega configurações e salva alteração do portal do cliente', async ({ page }) => {
		test.setTimeout(120_000);

		let postedBody: unknown = null;

		await page.route('**/api/integracoes/clientes', async (route, request) => {
			if (request.method() === 'GET') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						parameters: {
							data: [
								{ chave: 'cnpja_token', parametros: 'token-cnpja', created_at: '2026-04-11 10:00:00', usuario: { nome: 'Admin Master' } },
								{ chave: 'portal_pedidos', parametros: '1', created_at: '2026-04-11 10:01:00', usuario: { nome: 'Admin Master' } },
								{ chave: 'portal_orcamentos', parametros: '0' },
								{ chave: 'portal_titulos', parametros: '1' },
								{ chave: 'portal_notas_fiscais', parametros: '0' },
								{ chave: 'portal_token', id_filial: '10', parametros: 'portal-token-10', created_at: '2026-04-11 10:02:00', usuario: { nome: 'Admin Master' } },
							],
						},
						branches: {
							data: [
								{ id: '10', nome_fantasia: 'Matriz' },
								{ id: '11', nome_fantasia: 'Filial Norte' },
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

		await page.goto('/integracoes/clientes', {
			waitUntil: 'domcontentloaded',
			timeout: 60_000,
		});

		await waitForProtectedShell(page);
		await expect(page).toHaveURL(/\/integracoes\/clientes(?:\?|$)/);
		await expect(page.getByRole('button', { name: /cnpjá|cnpja/i })).toBeVisible();

		await page.getByRole('button', { name: /portal do cliente|client portal/i }).click();
		await expect(page.getByText('Matriz')).toBeVisible();

		const firstRow = page.locator('tbody tr').first();
		await firstRow.getByRole('button', { name: /alterar|change/i }).click();
		await firstRow.locator('input').fill('novo-token-portal');
		await page
			.getByRole('button', { name: /salvar|save/i })
			.first()
			.click();

		await expect.poll(() => postedBody).not.toBeNull();

		const payload = postedBody as {
			parameters?: Array<{ chave?: string; id_filial?: string | null; parametros?: string }>;
		};

		expect(payload.parameters?.some((item) => item.chave === 'portal_token' && item.id_filial === '10' && item.parametros === 'novo-token-portal')).toBe(true);
		expect(payload.parameters?.some((item) => item.chave === 'portal_pedidos' && item.parametros === '1')).toBe(true);
	});
});
