import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function formTextInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="text"]').nth(index)
}

function formSelect(page: Page, index: number): Locator {
  return formRoot(page).locator('select').nth(index)
}

function formDateInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="date"]').nth(index)
}

function formNumberInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="number"]').nth(index)
}

async function openCouponsList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName: /cupons desconto|discount coupons/i,
    urlPattern: /\/cupons-desconto(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates a discount coupon and shows it in the list', async ({ page }) => {
  const uniqueCode = `E2E-${Date.now()}`
  const description = `Cupom E2E ${uniqueCode}`
  let savedId: string | null = null

  try {
    await openCouponsList(page)

    await page.getByRole('link', { name: /novo/i }).click()
    await expect(page).toHaveURL(/\/cupons-desconto\/novo$/, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeVisible({ timeout: 60_000 })

    await formTextInput(page, 0).fill(uniqueCode)
    await formTextInput(page, 2).fill(description)
    await formSelect(page, 0).selectOption('percentual')
    await formTextInput(page, 2).fill('3433')
    await formSelect(page, 1).selectOption('todos')
    await formDateInput(page, 0).fill('2026-03-23')
    await formDateInput(page, 1).fill('2026-03-24')
    await formTextInput(page, 5).fill('23434')
    await formTextInput(page, 6).fill('3434')
    await formNumberInput(page, 1).fill('4')

    await page.getByRole('button', { name: /salvar|save/i }).first().click()
    await page.waitForURL(/\/cupons-desconto\/[^/]+\/editar$/, { timeout: 60_000 })

    const match = page.url().match(/\/cupons-desconto\/([^/]+)\/editar$/)
    savedId = match?.[1] ?? null
    expect(savedId).not.toBeNull()

    await expect(formTextInput(page, 0)).toHaveValue(uniqueCode)

    await openCouponsList(page)

    const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
    await expect(savedRow).toBeVisible({ timeout: 30_000 })
    await expect(savedRow).toContainText('34,33%')
  } finally {
    if (savedId) {
      await openCouponsList(page)

      const savedRow = page.locator('tbody tr').filter({ hasText: uniqueCode }).first()
      await expect(savedRow).toBeVisible({ timeout: 30_000 })

      await savedRow.locator('button').last().click()
      await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
      await page.getByRole('button', { name: /excluir|delete/i }).click()

      await expect(page.locator('tbody tr').filter({ hasText: uniqueCode })).toHaveCount(0)
    }
  }
})
