import { expect, test } from '@playwright/test'
import { dateInputAt, filterByCode, numberInputAt, openPromotionsModule, selectAt, textInputAt } from '@/e2e/helpers/crud'

test.setTimeout(120_000)

async function openCouponsList(page: Parameters<typeof openPromotionsModule>[0]) {
  await openPromotionsModule(page, {
    linkName: /cupons desconto|discount coupons/i,
    urlPattern: /\/cupons-desconto(?:\?|$)/,
    path: '/cupons-desconto',
  })
}

test('creates, filters, reopens and deletes a discount coupon through the UI', async ({ page }) => {
  const uniqueCode = `E2E-${Date.now()}`
  const description = `Cupom E2E ${uniqueCode}`
  let savedId: string | null = null

  try {
    await openCouponsList(page)
    await page.getByRole('link', { name: /novo|new/i }).click()
    await expect(page).toHaveURL(/\/cupons-desconto\/novo$/, { timeout: 60_000 })

    await textInputAt(page, 0).fill(uniqueCode)
    await selectAt(page, 0).selectOption('percentual')
    await textInputAt(page, 2).fill('34,33')
    await selectAt(page, 1).selectOption('todos')
    await dateInputAt(page, 0).fill('2026-03-23')
    await dateInputAt(page, 1).fill('2026-03-24')
    await textInputAt(page, 5).fill('234,34')
    await textInputAt(page, 6).fill('34,34')
    await numberInputAt(page, 1).fill('4')
    await textInputAt(page, 3).fill(description)

    await page.getByRole('button', { name: /salvar|save/i }).first().click()
    await page.waitForURL(/\/cupons-desconto\/[^/]+\/editar$/, { timeout: 60_000 })

    const match = page.url().match(/\/cupons-desconto\/([^/]+)\/editar$/)
    savedId = match?.[1] ?? null
    expect(savedId).not.toBeNull()

    await expect(textInputAt(page, 0)).toHaveValue(uniqueCode)
    await openCouponsList(page)
    await filterByCode(page, uniqueCode)

    const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
    await expect(savedRow).toBeVisible({ timeout: 30_000 })
    await savedRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/cupons-desconto\/[^/]+\/editar$/, { timeout: 30_000 })
    await expect(textInputAt(page, 0)).toHaveValue(uniqueCode)
  } finally {
    if (savedId) {
      await openCouponsList(page)
      await filterByCode(page, uniqueCode)
      const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
      await expect(savedRow).toBeVisible({ timeout: 30_000 })
      await savedRow.locator('button').last().click()
      await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
      await page.getByRole('button', { name: /excluir|delete/i }).click()
      await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
    }
  }
})
