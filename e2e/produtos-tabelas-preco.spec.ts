import { expect, test } from '@playwright/test'
import { openPriceStockModule, pickFirstLookupOption } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens quick pricing, saves, filters and reopens product price tables through the UI', async ({ page }) => {
  await openPriceStockModule(page, {
    linkName: /produtos x tabelas de pre[cç]o|products x price tables/i,
    urlPattern: /\/produtos-x-tabelas-de-preco(?:\?|$)/,
    path: '/produtos-x-tabelas-de-preco',
  })

  await page.getByRole('link', { name: /precifica[cç][aã]o r[aá]pida|quick pricing/i }).click()
  const productLabel = await pickFirstLookupOption(page, /^produto|product$/i)
  await page.locator('input').filter({ has: page.locator('..') }).nth(1).fill('12,50')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page.getByText(/salvos com sucesso|saved successfully/i)).toBeVisible({ timeout: 30_000 })

  await page.getByRole('link', { name: /voltar|back/i }).click()
  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await page.getByRole('textbox', { name: /^produto|product$/i }).fill(productLabel)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await page.locator('tbody tr').first().locator('a').first().click()
  await expect(page).toHaveURL(/\/produtos-x-tabelas-de-preco\/[^/]+\/editar$/)
  await expect(page.getByText(productLabel)).toBeVisible()
})
