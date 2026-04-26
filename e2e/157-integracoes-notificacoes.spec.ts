import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Integracoes > Notificacoes', () => {
  test('carrega parametros do Firebase e salva alteracao', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.route('**/api/integracoes/notificacoes', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'fcm_private_key', parametros: 'private-app', created_at: '2026-04-11 11:00:00', usuario: { nome: 'Admin Master' } },
                { chave: 'fcm_codigo', parametros: 'firebase-app' },
                { chave: 'fcm_sender_id', parametros: 'sender-app' },
                { chave: 'fcm_web_private_key', parametros: 'private-web' },
                { chave: 'fcm_web_api_key', parametros: 'web-api-key' },
                { chave: 'fcm_web_codigo', parametros: 'firebase-web' },
                { chave: 'fcm_web_app_id', parametros: 'app-id-web' },
                { chave: 'fcm_web_sender_id', parametros: 'sender-web' },
                { chave: 'fcm_web_vapid_key', parametros: 'vapid-key' },
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

    await page.goto('/integracoes/notificacoes', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)
    await expect(page).toHaveURL(/\/integracoes\/notificacoes(?:\?|$)/)
    await expect(page.getByText(/firebase \(aplicativos\)|firebase \(apps\)/i)).toBeVisible()

    await page.locator('main input').nth(2).fill('firebase-app-updated')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const payload = postedBody as {
      parameters?: Array<{ chave?: string; parametros?: string }>
    }

    expect(payload.parameters?.some((item) => item.chave === 'fcm_codigo' && item.parametros === 'firebase-app-updated')).toBe(true)
    expect(payload.parameters?.some((item) => item.chave === 'fcm_web_vapid_key' && item.parametros === 'vapid-key')).toBe(true)
  })
})
