import { expect, test } from '@playwright/test'

test.describe('Configurações > Geral', () => {
  test('abre o formulário dinâmico e salva apenas mudanças', async ({ page }) => {
    let postedBody: unknown = null

    await page.route('**/api/configuracoes/geral', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            schema: {
              data: [
                {
                  chave: 'modo_ecommerce',
                  nome: 'Modo e-commerce',
                  descricao: 'Modo principal do tenant.',
                  tipo_entrada: 'combo',
                  fonte_dados: 'lista_fixa',
                  dados: JSON.stringify([
                    { value: 'b2b', text: 'B2B' },
                    { value: 'b2c', text: 'B2C' },
                  ]),
                  ordem: 1,
                },
                {
                  chave: 'url_site',
                  nome: 'URL do site',
                  descricao: 'URL pública da operação.',
                  tipo_entrada: 'texto',
                  ordem: 2,
                },
              ],
            },
            parameters: {
              data: [
                {
                  chave: 'modo_ecommerce',
                  parametros: 'b2b',
                  created_at: '2026-04-02 10:00:00',
                  usuario: { nome: 'Administrador' },
                },
              ],
            },
            company: {
              data: [
                {
                  id: '77',
                  codigo: '117',
                  id_template: '12',
                  url: 'https://tenant.exemplo.com.br',
                },
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

    await page.goto('/configuracoes/geral', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('form')).toBeVisible()

    await page.locator('form').locator('input').first().fill('https://novo.exemplo.com.br')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const parsed = postedBody as {
      parameters?: Array<{ chave?: string; parametros?: string }>
      company?: { id?: string; url?: string }
    }

    expect(parsed.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ chave: 'url_site', parametros: 'https://novo.exemplo.com.br' }),
      ]),
    )
    expect(parsed.company).toEqual(expect.objectContaining({ id: '77', url: 'https://novo.exemplo.com.br' }))
  })
})
