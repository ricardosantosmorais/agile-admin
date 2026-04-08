import { expect, test } from '@playwright/test'

test.setTimeout(120_000)

test('renews tenant cache from maintenance screen', async ({ page }) => {
  await page.route('**/api/renovar-cache', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Cache renovado com sucesso.' }),
    })
  })

  await page.goto('/renovar-cache')
  await expect(page.getByRole('heading', { name: /renovar cache|renew cache/i })).toBeVisible()

  await page.getByRole('button', { name: /renovar cache|renew cache/i }).click()
  await expect(page.getByText(/cache renovado com sucesso|cache refreshed successfully/i)).toBeVisible()
})
