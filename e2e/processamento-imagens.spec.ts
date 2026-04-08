import { expect, test } from '@playwright/test'

test.setTimeout(120_000)

test('shows image processing list and opens upload modal', async ({ page }) => {
  await page.route('**/api/processos-imagens**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 15 },
      }),
    })
  })

  await page.goto('/processamento-de-imagens')
  await expect(page.getByText(/processamento de imagens|image processing/i).first()).toBeVisible()
  await page.getByRole('button', { name: /novo \(zip\)|new \(zip\)/i }).click()
  await expect(page.getByText(/enviar novo arquivo|upload new file/i)).toBeVisible()
})
