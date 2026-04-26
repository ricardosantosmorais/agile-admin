import { expect, test } from '@playwright/test'
import { openPriceStockModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens quick pricing, saves and returns to the list through the UI', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /produtos x tabelas de preço|products x price tables/i,
    urlPattern: /\/produtos-x-tabelas-de-preco(?:\?|$)/,
    path: '/produtos-x-tabelas-de-preco',
  })

  await page.getByRole('link', { name: /precificação rápida|quick pricing/i }).click()
  await expect(page).toHaveURL(/\/produtos-x-tabelas-de-preco\/novo$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /selecione produto|select product/i }).click()
  const search = page.getByRole('combobox', { name: /buscar produto|search product/i }).last()
  await expect(search).toBeVisible({ timeout: 10_000 })
  const option = page.getByRole('listbox').last().getByRole('option').first()
  await expect(option).toBeVisible({ timeout: 20_000 })
  const productLabel = ((await option.textContent()) || '').trim()
  await option.click()
  await expect(page.getByRole('button', { name: new RegExp(productLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first()).toBeVisible()

  await page.locator('input').nth(1).fill('12,50')
  const saveResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/produtos-x-tabelas-de-preco/rapida') && response.request().method() === 'POST',
    { timeout: 15_000 },
  ).catch(() => null)

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  const saveResponse = await saveResponsePromise
  if (saveResponse && !saveResponse.ok()) {
    throw new Error(`Falha ao salvar precificação rápida: ${await saveResponse.text()}`)
  }

  await expect(page.getByText(/salvos com sucesso|saved successfully/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('link', { name: /voltar|back/i }).first().click()
  await expect(page).toHaveURL(/\/produtos-x-tabelas-de-preco(?:\?|$)/, { timeout: 30_000 })
})
