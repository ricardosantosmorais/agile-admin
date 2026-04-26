import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Integrações > Logística', () => {
  test('carrega abas, dados do IBoltt e salva alteração sem reenviar tokens', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.route('**/api/integracoes/logistica', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            parameters: {
              data: [
                { chave: 'link_rastreamento', parametros: 'https://tracking.test', created_at: '2026-04-11 10:00:00', usuario: { nome: 'Admin Master' } },
                { chave: 'frenet_token', parametros: '***frenet***' },
                { chave: 'frenet_ambiente', parametros: 'homologacao' },
                { chave: 'frenet_nota_fiscal', parametros: '0' },
                { chave: 'iboltt_company_id', id_filial: '10', parametros: 'company-10' },
                { chave: 'iboltt_token', id_filial: '10', parametros: '***iboltt***' },
                { chave: 'iboltt_status', parametros: 'faturado' },
              ],
            },
            branches: {
              data: [
                { id: '10', nome_fantasia: 'Filial Centro' },
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

    await page.goto('/integracoes/logistica', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    await waitForProtectedShell(page)
    await expect(page).toHaveURL(/\/integracoes\/logistica(?:\?|$)/)
    await expect(page.getByRole('button', { name: /dados gerais|general data/i })).toBeVisible()

    await page.getByRole('button', { name: /iboltt/i }).click()
    await expect(page.getByText('Filial Centro - 10')).toBeVisible()
    await page.getByRole('button', { name: /dados gerais|general data/i }).click()
    await page.getByLabel(/link para rastreamento|tracking link/i).fill('https://tracking-updated.test')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const payload = postedBody as {
      parameters?: Array<{ chave?: string; parametros?: string; id_filial?: string | null }>
    }

    expect(payload.parameters?.some((item) => item.chave === 'link_rastreamento' && item.parametros === 'https://tracking-updated.test')).toBe(true)
    expect(payload.parameters?.some((item) => item.chave === 'frenet_token')).toBe(false)
    expect(payload.parameters?.some((item) => item.chave === 'iboltt_token')).toBe(false)
  })
})
