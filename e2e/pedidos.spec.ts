import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Pedidos', () => {
  test('abre listagem e detalhe do pedido', async ({ page }) => {
    await page.goto('/pedidos', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await expect(page.getByRole('main').getByText('Pedidos').last()).toBeVisible()
    await expect(page.getByRole('button', { name: /filtros|filters/i })).toBeVisible()

    const firstView = page.locator('tbody tr a').first()
    await expect(firstView).toBeVisible({ timeout: 30_000 })
    await firstView.click()

    await expect(page).toHaveURL(/\/pedidos\/.+$/, { timeout: 30_000 })
    await expect(page.getByRole('main').getByText(/ID #/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Informações|Information/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrega|Delivery/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Produtos|Products/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Timeline/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Detalhes|Details/i })).toBeVisible()

    await expect(page.getByRole('heading', { name: /Informa\u00e7\u00f5es|Information/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Valores|Amounts/i })).toBeVisible()
    await expect(page.locator('#pedido-observacoes-internas')).toBeVisible()

    await page.getByRole('button', { name: /Entrega|Delivery/i }).click()
    await expect(page.getByRole('heading', { name: /Pagamento|Payment/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Cliente|Customer/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Entrega|Delivery/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Cobran\u00e7a|Billing/i })).toBeVisible()

    await page.getByRole('button', { name: /Produtos|Products/i }).click()
    await expect(page.getByRole('heading', { name: /Produtos|Products/i })).toBeVisible()

    await page.getByRole('button', { name: /Timeline/i }).click()
    await expect(page.getByRole('heading', { name: /Timeline/i })).toBeVisible()

    await page.getByRole('button', { name: /Detalhes|Details/i }).click()
    await expect(page.getByRole('heading', { name: /Detalhes|Details/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Logs/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible()
  })
})
