import { expect, test } from '@playwright/test';

test.describe('Integrações > Gateways de Pagamento', () => {
	test('deve abrir listagem', async ({ page }) => {
		await page.goto('/integracoes/gateways-pagamento');

		await expect(page.getByRole('heading', { name: /gateways de pagamento/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /Atualizar|Refresh/i })).toBeVisible();
	});

	test('deve navegar para novo gateway', async ({ page }) => {
		await page.goto('/integracoes/gateways-pagamento');

		const novoBtn = page.getByRole('link', { name: /novo|new/i }).first();
		await expect(novoBtn).toBeVisible();
		await novoBtn.click();

		await expect(page).toHaveURL(/\/integracoes\/gateways-pagamento\/novo/);
		await expect(page.getByRole('heading', { name: /gateways de pagamento/i })).toBeVisible();
	});

	test('deve exibir campos condicionais ao selecionar tipo e gateway PIX Itaú', async ({ page }) => {
		await page.goto('/integracoes/gateways-pagamento/novo');

		await page.getByLabel(/tipo|type/i).selectOption('pix');
		await page.getByLabel(/gateway/i).selectOption('itau');

		await expect(page.getByLabel(/client id/i)).toBeVisible();
		await expect(page.getByRole('main')).toContainText(/Client Secret|cliente secreta/i);
		await expect(page.getByLabel(/certificado/i)).toBeVisible();
		await expect(page.getByLabel(/chave privada|private key/i)).toBeVisible();
	});

	test('deve exibir campos condicionais ao selecionar tipo e gateway Cartão Crédito Cielo', async ({ page }) => {
		await page.goto('/integracoes/gateways-pagamento/novo');

		await page.getByLabel(/tipo|type/i).selectOption('cartao_credito');
		await page.getByLabel(/gateway/i).selectOption('cielo');

		await expect(page.getByLabel(/merchant id/i)).toBeVisible();
		await expect(page.getByRole('main')).toContainText(/merchant key|merchant key/i);
	});
});
