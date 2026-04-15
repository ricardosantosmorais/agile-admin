import { expect, test } from '@playwright/test';
import { waitForProtectedShell } from '@/e2e/helpers/auth';

test.describe('Menu do cliente', () => {
	test('abre meus atendimentos, base de conhecimento e atualizações gerais no v2', async ({ page }) => {
		await page.route(/\/api\/meus-atendimentos(?:\?.*)?$/, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: [
						{
							id: 'conv-1',
							protocolo: 'conv-1',
							data_abertura: 1712750400,
							data_encerramento: 0,
							status: 'open',
						},
					],
					meta: {
						page: 1,
						pages: 1,
						perPage: 5,
						from: 1,
						to: 1,
						total: 1,
					},
					nextCursor: null,
				}),
			});
		});

		await page.route(/\/api\/meus-atendimentos\/conv-1$/, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 'conv-1',
					protocolo: 'conv-1',
					status: 'open',
					assunto: 'Preciso de ajuda',
					dataAbertura: 1712750400,
					dataEncerramento: 0,
					timeline: [
						{
							id: 'part-1',
							authorName: 'Cliente Teste',
							authorType: 'contact',
							body: '<p>Mensagem inicial</p>',
							createdAt: 1712750400,
							partType: 'comment',
						},
					],
				}),
			});
		});

		await page.route('/api/base-conhecimento**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: [
						{
							id: 'art-1',
							titulo: 'Como alterar a senha',
							descricao: 'Passo a passo',
							dataCriacao: 1712750400,
							html: '<p>Conteúdo do artigo</p>',
						},
					],
					meta: {
						page: 1,
						pages: 1,
						perPage: 15,
						from: 1,
						to: 1,
						total: 1,
					},
				}),
			});
		});

		await page.route('/api/atualizacoes-gerais**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: [
						{
							id: 'chg-1',
							titulo: 'Melhoria no catálogo',
							data: '2026-04-10 00:00:00',
							plataforma: 'admin',
							tipo: 'melhoria',
							apenasMaster: false,
							conteudo: '<p>Novo resumo visual.</p>',
						},
					],
					meta: { total: 1 },
				}),
			});
		});

		await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await waitForProtectedShell(page);

		await page.goto('/meus-atendimentos', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.getByRole('heading', { name: /meus atendimentos|my tickets/i })).toBeVisible();
		await expect(page.getByRole('table').getByText('conv-1')).toBeVisible();
		await page.getByRole('button', { name: /visualizar|view/i }).click();
		await expect(page.getByText('Mensagem inicial')).toBeVisible();

		await page.goto('/base-de-conhecimento', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.getByRole('heading', { name: /base de conhecimento|knowledge base/i })).toBeVisible();
		await expect(page.getByRole('table').getByText('Como alterar a senha')).toBeVisible();

		await page.goto('/atualizacoes-gerais', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.getByRole('heading', { name: /atualizações gerais|general updates/i })).toBeVisible();
		await expect(page.getByText('Melhoria no catálogo')).toBeVisible();
	});
});
