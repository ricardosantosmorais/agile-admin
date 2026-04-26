import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Integrações > Promoções', () => {
  test('carrega configurações do IdEver e salva alteração sem reenviar secrets', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.route('**/api/integracoes/promocoes', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'idever_client_id', parametros: 'client-id', created_at: '2026-04-11 10:00:00', usuario: { nome: 'Admin Master' } },
                { chave: 'idever_client_secret', parametros: '***client-secret***' },
                { chave: 'idever_app_id', parametros: 'app-id' },
                { chave: 'idever_app_secret', parametros: '***app-secret***' },
                { chave: 'idever_rule_id', parametros: 'rule-id' },
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

    await page.goto('/integracoes/promocoes', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    await waitForProtectedShell(page)
    await expect(page).toHaveURL(/\/integracoes\/promocoes(?:\?|$)/)
    await expect(page.getByRole('heading', { name: /idever/i })).toBeVisible()

    const clientIdInput = page.locator('main input').nth(1)
    await clientIdInput.fill('client-id-updated')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const payload = postedBody as {
      parameters?: Array<{ chave?: string; parametros?: string }>
    }

    expect(payload.parameters?.some((item) => item.chave === 'idever_client_id' && item.parametros === 'client-id-updated')).toBe(true)
    expect(payload.parameters?.some((item) => item.chave === 'idever_client_secret')).toBe(false)
    expect(payload.parameters?.some((item) => item.chave === 'idever_app_secret')).toBe(false)
  })
})
