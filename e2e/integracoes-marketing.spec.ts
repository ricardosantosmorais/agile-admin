import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Integrações > Marketing', () => {
  test('carrega configurações e salva alteração de Google', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.route('**/api/integracoes/marketing', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'ga4', parametros: 'G-123456', created_at: '2026-04-10 10:00:00', usuario: { nome: 'Admin Master' } },
                { chave: 'versao_datalayer', parametros: 'GA4' },
                { chave: 'fb_token', parametros: '***token***' },
                { chave: 'rd_ecom_refresh_token', parametros: '***refresh***' },
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

    await page.goto('/integracoes/marketing', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    await waitForProtectedShell(page)
    await expect(page).toHaveURL(/\/integracoes\/marketing(?:\?|$)/)
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    const ga4Input = page.getByLabel(/GA4 \(Web\/Mobile\)/i).first()
    await expect(ga4Input).toBeVisible()

    await ga4Input.fill('G-999999')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const payload = postedBody as {
      parameters?: Array<{ chave?: string; parametros?: string }>
    }

    expect(payload.parameters?.some((item) => item.chave === 'ga4' && item.parametros === 'G-999999')).toBe(true)
    expect(payload.parameters?.some((item) => item.chave === 'fb_token')).toBe(false)
  })
})
