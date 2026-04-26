import { expect, test } from '@playwright/test'

test.describe('Configurações > Início', () => {
  test('carrega a tela e salva apenas os parâmetros alterados', async ({ page }) => {
    await page.route('**/api/configuracoes/inicio', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'id_cliente_inicio', parametros: '10' },
                { chave: 'id_forma_pagamento_inicio', parametros: '801' },
              ],
            },
            branches: { data: [{ id: '2', nome_fantasia: 'Matriz' }] },
            paymentMethods: { data: [{ id: '801', nome: 'PIX' }, { id: '900', nome: 'Boleto' }] },
            paymentConditions: { data: [{ id: '15', nome: '14/21 dias' }] },
            priceTables: { data: [{ id: '3', nome: 'Padrão' }] },
          }),
        })
        return
      }

      const payload = route.request().postDataJSON() as {
        parameters: Array<{ chave: string; parametros: string }>
      }
      expect(payload.parameters).toEqual([
        { id_filial: null, chave: 'versao', parametros: expect.any(String) },
        { id_filial: null, chave: 'id_cliente_inicio', parametros: '15' },
      ])

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/configuracoes/inicio')
    await expect(page.locator('form')).toBeVisible()
    await page.locator('form').locator('input').first().fill('15')
    await page.getByRole('button', { name: 'Salvar' }).first().click()
  })
})
