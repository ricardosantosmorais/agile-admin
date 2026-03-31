import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Editor SQL', () => {
  test('abre a tela principal e os modais do editor', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/ferramentas/editor-sql', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await expect(page.getByRole('main').getByText(/Editor SQL/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Nova aba|New tab/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Executar|Run query/i }).first()).toBeVisible()
    await expect(page.getByLabel(/Fonte de dados|Data source/i)).toBeVisible()
    await expect(page.locator('[data-testid="sql-editor-monaco"]').first()).toBeVisible()

    await page.getByRole('button', { name: /Carregar consulta|Load query/i }).first().click()
    await expect(page.getByRole('heading', { name: /Consultas salvas|Saved queries/i })).toBeVisible()
    await page.getByRole('button', { name: /Fechar modal/i }).click()
    await expect(page.getByRole('heading', { name: /Consultas salvas|Saved queries/i })).toBeHidden()

    await page.getByRole('button', { name: /Tela cheia|Fullscreen/i }).click()
    await expect(page.getByRole('heading', { name: /Editor SQL em tela cheia|Fullscreen SQL editor/i })).toBeVisible()
    await page.getByRole('button', { name: /Fechar modal/i }).click()
    await expect(page.getByRole('heading', { name: /Editor SQL em tela cheia|Fullscreen SQL editor/i })).toBeHidden()
  })
})
