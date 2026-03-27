import { expect, test } from '@playwright/test'

test.setTimeout(180_000)

test('loads lower dashboard charts only after the user scrolls', async ({ page }) => {
  const requestedBlocks: string[] = []

  page.on('request', (request) => {
    if (!request.url().includes('/api/dashboard') || request.method() !== 'POST') {
      return
    }

    try {
      const payload = JSON.parse(request.postData() ?? '{}') as { blocks?: string[] }
      requestedBlocks.push(...(payload.blocks ?? []))
    } catch {
      // noop
    }
  })

  await page.goto('/dashboard')

  await expect(page.getByRole('button', { name: /atualizar dados|refresh data/i })).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => requestedBlocks.includes('resumo')).toBeTruthy()

  await page.waitForTimeout(1_000)
  expect(requestedBlocks.includes('marketing_tops')).toBeFalsy()

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
  })

  await expect.poll(() => requestedBlocks.includes('marketing_tops'), { timeout: 30_000 }).toBeTruthy()
})
