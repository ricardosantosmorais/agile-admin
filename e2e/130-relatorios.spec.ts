import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Relatórios', () => {
  test('abre a listagem e o detalhe operacional do relatório', async ({ page }) => {
    await page.goto('/relatorios', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await expect(page.getByRole('main').getByText(/Relatórios|Reports/i).last()).toBeVisible()
    await expect(page.getByRole('button', { name: /Filtros|Filters/i })).toBeVisible()

    const firstAction = page.locator('tbody tr a').first()
    await expect(firstAction).toBeVisible({ timeout: 30_000 })
    await firstAction.click()

    await expect(page).toHaveURL(/\/relatorios\/.+$/, { timeout: 30_000 })
    await expect(page.getByRole('button', { name: /Atualizar processos|Refresh processes/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /ID/i })).toBeVisible()
  })
})
