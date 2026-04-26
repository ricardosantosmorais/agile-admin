import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

async function openGateways(page: import('@playwright/test').Page, path = '/integracoes/gateways-pagamento') {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
}

test.describe('Integracoes > Gateways de Pagamento', () => {
  test('deve abrir listagem', async ({ page }) => {
    await openGateways(page)

    await expect(page.getByText(/gateways de pagamento/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Atualizar|Refresh/i })).toBeVisible()
  })

  test('deve navegar para novo gateway', async ({ page }) => {
    await openGateways(page)

    const novoBtn = page.getByRole('link', { name: /novo|new/i }).first()
    await expect(novoBtn).toBeVisible()
    await novoBtn.click()

    await expect(page).toHaveURL(/\/integracoes\/gateways-pagamento\/novo/)
    await expect(page.getByText(/dados principais|main data/i).first()).toBeVisible()
  })

  test('deve exibir campos condicionais ao selecionar tipo e gateway PIX Itau', async ({ page }) => {
    await openGateways(page, '/integracoes/gateways-pagamento/novo')

    await page.locator('main select').nth(0).selectOption('pix')
    await page.locator('main select').nth(1).selectOption('itau')

    await expect(page.getByText(/client id/i).first()).toBeVisible()
    await expect(page.getByText(/client secret|cliente secreta/i).first()).toBeVisible()
    await expect(page.getByText(/certificado/i).first()).toBeVisible()
    await expect(page.getByText(/chave privada|private key/i).first()).toBeVisible()
  })

  test('deve exibir campos condicionais ao selecionar tipo e gateway Cartao Credito Cielo', async ({ page }) => {
    await openGateways(page, '/integracoes/gateways-pagamento/novo')

    await page.locator('main select').nth(0).selectOption('cartao_credito')
    await page.locator('main select').nth(1).selectOption('cielo')

    await expect(page.getByText(/merchant id/i).first()).toBeVisible()
    await expect(page.getByText(/merchant key/i).first()).toBeVisible()
  })
})
