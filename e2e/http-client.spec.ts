import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('HTTP Client', () => {
  test('abre a tela e carrega os controles principais', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/ferramentas/http-client', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await expect(page.getByRole('main').getByText(/HTTP Client/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Catalogo/i }).first()).toBeVisible()
    await expect(page.getByText(/Origem do endpoint/i).first()).toBeVisible()
    await expect(page.getByText(/Resposta/i).first()).toBeVisible()

    await page.getByRole('button', { name: /Catalogo/i }).first().click()
    await expect(page.getByRole('heading', { name: /Catalogo de requisicoes/i })).toBeVisible()
    await page.getByRole('button', { name: /Fechar modal/i }).click()
    await expect(page.getByRole('heading', { name: /Catalogo de requisicoes/i })).toBeHidden()
  })
})
