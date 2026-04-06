import { expect, test } from '@playwright/test'

test.describe('Configurações > Layout', () => {
  test('carrega a tela e salva apenas os campos alterados', async ({ page }) => {
    await page.route('**/api/configuracoes/layout', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'css', parametros: '.hero { color: red; }' },
                { chave: 'meta_titulo', parametros: 'Título antigo' },
              ],
            },
            company: {
              data: [
                {
                  id: '1698203521854804',
                  logo: 'https://cescom.agilecdn.com.br/imgs/logo.png',
                  logo_alt: 'https://cescom.agilecdn.com.br/imgs/logo.png',
                  ico: 'https://cescom.agilecdn.com.br/imgs/ico.png',
                  s3_bucket: 'https://cescom.agilecdn.com.br',
                },
              ],
            },
          }),
        })
        return
      }

      const payload = route.request().postDataJSON() as {
        changedKeys: string[]
        values: Record<string, string>
      }

      expect(payload.changedKeys).toEqual(['meta_titulo'])
      expect(payload.values.meta_titulo).toBe('Título novo')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/configuracoes/layout')
    await expect(page.getByRole('button', { name: 'SEO' })).toBeVisible()
    await page.getByRole('button', { name: 'SEO' }).click()
    await page.locator('form').locator('input').first().fill('Título novo')
    await page.getByRole('button', { name: 'Salvar' }).click()
  })
})
