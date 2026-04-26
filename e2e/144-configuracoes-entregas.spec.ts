import { expect, test } from '@playwright/test'

test.describe('Configurações > Entregas', () => {
  test('abre o formulário direto, carrega parâmetros e salva alterações', async ({ page }) => {
    let postedBody: unknown = null

    await page.route('**/api/configuracoes/entregas', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                {
                  chave: 'calcula_frete',
                  parametros: '1',
                  created_at: '2026-04-02 10:00:00',
                  usuario: { nome: 'Administrador' },
                },
                {
                  chave: 'id_forma_entrega_padrao',
                  parametros: '55',
                  created_at: '2026-04-02 10:01:00',
                  usuario: { nome: 'Administrador' },
                },
              ],
            },
            deliveryMethods: {
              data: [
                { id: '55', nome: 'Entrega expressa' },
                { id: '99', nome: 'Retirada na loja' },
              ],
            },
          }),
        })
        return
      }

      postedBody = request.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/configuracoes/entregas', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('form')).toBeVisible()

    await page.locator('form').locator('select').nth(1).selectOption('0')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const parsed = postedBody as { parameters?: Array<{ chave?: string; parametros?: string }> }
    expect(parsed.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ chave: 'calcula_frete', parametros: '0' }),
      ]),
    )
  })
})
