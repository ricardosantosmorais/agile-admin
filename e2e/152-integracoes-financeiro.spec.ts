import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Integracoes > Financeiro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integracoes/financeiro', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)
  })

  test('deve carregar a pagina com as abas principais', async ({ page }) => {
    for (const tabName of [/boleto/i, /cart.o/i, /^pix$/i, /clearsale/i, /konduto/i]) {
      await expect(page.getByRole('button', { name: tabName })).toBeVisible()
    }
  })

  test('deve alternar entre abas corretamente', async ({ page }) => {
    await page.getByRole('button', { name: /^pix$/i }).click()
    await expect(page.getByRole('button', { name: /^pix$/i })).toHaveClass(/app-pill-tab-active/)

    await page.getByRole('button', { name: /clearsale/i }).click()
    await expect(page.getByLabel(/ambiente|environment/i).first()).toBeVisible()
  })

  test('deve exibir tabela de filiais na aba Boleto', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible()
    await expect(page.getByText(/filial|branch/i).first()).toBeVisible()
    await expect(page.getByText(/gateway de pagamento|payment gateway/i).first()).toBeVisible()
  })

  test('deve desabilitar botao Salvar sem mudancas', async ({ page }) => {
    await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeDisabled()
  })

  test('deve habilitar botao Salvar apos mudanca em ClearSale', async ({ page }) => {
    await page.getByRole('button', { name: /clearsale/i }).click()

    const ambienteSelect = page.getByLabel(/ambiente|environment/i).first()
    await expect(ambienteSelect).toBeVisible()
    const currentValue = await ambienteSelect.inputValue()
    await ambienteSelect.selectOption(currentValue === 'producao' ? 'teste' : 'producao')

    await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeEnabled()
  })

  test('deve exibir campos de ClearSale corretamente', async ({ page }) => {
    await page.getByRole('button', { name: /clearsale/i }).click()

    await expect(page.getByLabel(/ambiente|environment/i).first()).toBeVisible()
    await expect(page.getByText(/^login$/i).first()).toBeVisible()
    await expect(page.getByText(/^senha$|^password$/i).first()).toBeVisible()
    await expect(page.getByText(/^fingerprint$/i).first()).toBeVisible()
    await expect(page.getByText(/modo de opera..o|operation mode/i).first()).toBeVisible()
    await expect(page.getByText(/custom sla/i).first()).toBeVisible()
    await expect(page.getByText(/envia pedidos em pix|send pix orders/i).first()).toBeVisible()
  })

  test('deve exibir campos de Konduto corretamente', async ({ page }) => {
    await page.getByRole('button', { name: /^konduto/i }).click()

    await expect(page.getByLabel(/ambiente|environment/i).first()).toBeVisible()
    await expect(page.getByLabel(/chave p.blica|public key/i).first()).toBeVisible()
    await expect(page.getByText(/chave privada|private key/i).first()).toBeVisible()
  })

  test('deve tratar senha existente sem quebrar o fluxo', async ({ page }) => {
    await page.getByRole('button', { name: /clearsale/i }).click()

    const passwordInput = page.locator('input').filter({ hasText: /^$/ }).nth(0)
    await expect(page.getByText(/^senha$|^password$/i).first()).toBeVisible()

    if (await passwordInput.isVisible().catch(() => false) && await passwordInput.isDisabled()) {
      const alterButton = page.getByRole('button', { name: /alterar|change/i }).first()
      await expect(alterButton).toBeVisible()
      await alterButton.click()
      await expect(passwordInput).toBeEnabled()
    }
  })
})
