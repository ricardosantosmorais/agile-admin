import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Integracoes > Atendimento', () => {
  test('carrega configuracoes e salva alteracoes de WhatsApp', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.route('**/api/integracoes/atendimento', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'whatsapp_exibicao', parametros: 'lado_direito', created_at: '2026-04-09 10:00:00', usuario: { nome: 'Admin Master' } },
                { chave: 'whatsapp_gateway', parametros: 'meta', created_at: '2026-04-09 10:01:00', usuario: { nome: 'Admin Master' } },
                { chave: 'whatsapp_api_token', parametros: 'token-mascarado', created_at: '2026-04-09 10:02:00', usuario: { nome: 'Admin Master' } },
                { chave: 'jivo_js', parametros: '//code.jivosite.com/widget/abc', created_at: '2026-04-09 10:03:00', usuario: { nome: 'Admin Master' } },
                { chave: 'ebit_codigo', parametros: 'EBIT-01', created_at: '2026-04-09 10:04:00', usuario: { nome: 'Admin Master' } },
                { chave: 'whatsapp_numero', id_filial: '10', parametros: '(11) 99999-0000', created_at: '2026-04-09 10:05:00', usuario: { nome: 'Admin Master' } },
                { chave: 'whatsapp_id_numero', id_filial: '10', parametros: '123456' },
              ],
            },
            branches: {
              data: [
                { id: '10', nome_fantasia: 'Matriz' },
                { id: '11', nome_fantasia: 'Filial Norte' },
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

    await page.goto('/integracoes/atendimento', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)
    await expect(page).toHaveURL(/\/integracoes\/atendimento(?:\?|$)/)
    await expect(page.getByRole('button', { name: /whatsapp/i })).toBeVisible()
    await expect(page.getByText('Matriz - 10')).toBeVisible()

    await page.locator('tbody tr').first().locator('input').nth(0).fill('(11) 98888-7777')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const payload = postedBody as {
      parameters?: Array<{ chave?: string; id_filial?: string | null; parametros?: string }>
    }

    expect(payload.parameters?.some((item) => item.chave === 'whatsapp_numero' && item.id_filial === '10' && item.parametros === '(11) 98888-7777')).toBe(true)
    expect(payload.parameters?.some((item) => item.chave === 'whatsapp_gateway' && item.parametros === 'meta')).toBe(true)
  })
})
