import { test, expect } from '@playwright/test';

test.describe('Integrações > Financeiro', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/integracoes/financeiro');
	});

	test('deve carregar a página com as 5 abas', async ({ page }) => {
		// Aguarda o carregamento das abas
		await expect(page.getByRole('button', { name: /Boleto|Cartão|PIX|ClearSale|Konduto/ })).toBeVisible();

		// Verifica se as 5 abas estão visíveis
		expect(await page.getByText('Boleto Bancário')).toBeVisible();
		expect(await page.getByText('Cartão de Crédito')).toBeVisible();
		expect(await page.getByText('PIX')).toBeVisible();
		expect(await page.getByText('ClearSale')).toBeVisible();
		expect(await page.getByText('Konduto')).toBeVisible();
	});

	test('deve alternar entre abas corretamente', async ({ page }) => {
		// Clica na aba PIX
		await page.getByRole('button', { name: /PIX/ }).click();

		// Verifica se a aba está ativa (classe especifica ou atributo)
		const pixTab = page.getByRole('button', { name: /PIX/ });
		expect(pixTab).toHaveClass(/.*active.*|.*border-blue.*/);

		// Clica na aba ClearSale
		await page.getByRole('button', { name: /ClearSale/ }).click();

		// Verifica se o conteúdo da aba mudar (procura por campo específico)
		expect(await page.getByLabel(/Ambiente/)).toBeVisible();
	});

	test('deve exibir tabela de filiais na aba Boleto', async ({ page }) => {
		// Na aba Boleto (ativa por padrão)
		const table = page.locator('table');
		await expect(table).toBeVisible();

		// Verifica se tem cabeçalhos da tabela
		expect(await page.getByText('Filial')).toBeVisible();
		expect(await page.getByText('Gateway de Pagamento')).toBeVisible();
	});

	test('deve desabilitar botão Salvar sem mudanças', async ({ page }) => {
		const saveButton = page.getByRole('button', { name: /Salvar/ });

		// Inicialmente, deve estar desabilitado (sem mudanças)
		await expect(saveButton).toBeDisabled();
	});

	test('deve habilitar botão Salvar após mudança em ClearSale', async ({ page }) => {
		// NavegaM para ClearSale
		await page.getByRole('button', { name: /ClearSale/ }).click();

		// Aguarda campo de ambiente estar visível
		const ambienteSelect = page.getByLabel(/Ambiente/);
		await expect(ambienteSelect).toBeVisible();

		// Muda o valor
		await ambienteSelect.selectOption('producao');

		// Botão Salvar agora deve estar habilitado
		const saveButton = page.getByRole('button', { name: /Salvar/ });
		await expect(saveButton).toBeEnabled();
	});

	test('deve exibir campos de ClearSale corretamente', async ({ page }) => {
		await page.getByRole('button', { name: /ClearSale/ }).click();

		// Verifica se todos os campos estão presentes
		expect(await page.getByLabel(/Ambiente/)).toBeVisible();
		expect(await page.getByLabel(/^Login$/)).toBeVisible();
		expect(await page.getByLabel(/^Senha$/)).toBeVisible();
		expect(await page.getByLabel(/^Fingerprint$/)).toBeVisible();
		expect(await page.getByLabel(/Modo de Operação/)).toBeVisible();
		expect(await page.getByLabel(/Custom SLA/)).toBeVisible();
		expect(await page.getByLabel(/Envia Pedidos em PIX/)).toBeVisible();
	});

	test('deve exibir campos de Konduto corretamente', async ({ page }) => {
		await page.getByRole('button', { name: /^Konduto/ }).click();

		// Verifica se todos os campos estão presentes
		expect(await page.getByLabel(/Ambiente/)).toBeVisible();
		expect(await page.getByLabel(/Chave Pública/)).toBeVisible();
		expect(await page.getByLabel(/Chave Privada/)).toBeVisible();
	});

	test('deve desabilitar campo de senha se já existe', async ({ page }) => {
		// Isso dependerá de dados preexistentes no servidor
		// Navegamos para ClearSale
		await page.getByRole('button', { name: /ClearSale/ }).click();

		// Se houver dados pré-carregados com senha, o campo deve estar desabilitado
		const senhaField = page.getByLabel(/^Senha$/);
		const isDisabled = await senhaField.isDisabled();

		// Se desabilitado, deve ter botão "Alterar"
		if (isDisabled) {
			const alterButton = page.getByRole('button', { name: /Alterar/ });
			await expect(alterButton).toBeVisible();
		}
	});

	test('deve permitir alterar senha ao clicar em Alterar', async ({ page }) => {
		await page.getByRole('button', { name: /ClearSale/ }).click();

		const senhaField = page.getByLabel(/^Senha$/);
		const alterButton = page.getByRole('button', { name: /Alterar/ });

		// Se o campo está desabilitado, clica em Alterar
		if (await senhaField.isDisabled()) {
			await alterButton.click();

			// Agora o campo deve estar habilitado
			await expect(senhaField).toBeEnabled();
		}
	});
});
