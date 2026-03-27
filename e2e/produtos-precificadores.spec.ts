import { expect, test } from '@playwright/test'
import { openPriceStockModule } from '@/e2e/helpers/crud'

test('produtos x precificadores creates via wizard and deletes', async ({ page }) => {
  const stamp = Date.now().toString().slice(-6)
  const ruleName = `Precificador ${stamp}`

  await openPriceStockModule(page, {
    linkName: /produtos x precificadores|products x pricers/i,
    urlPattern: /\/produtos-x-precificadores$/,
    path: '/produtos-x-precificadores',
  })

  await page.getByRole('link', { name: /assistente de criação|creation assistant/i }).click()
  await expect(page).toHaveURL(/\/produtos-x-precificadores\/novo$/)

  await page.getByRole('button', { name: /^próximo$|^next$/i }).click()

  await page.getByRole('combobox').first().selectOption('produto')
  await page.getByRole('button', { name: /select product|selecione produto/i }).first().click()
  const option = page.locator('button').filter({ has: page.locator('p.font-medium') }).first()
  await expect(option).toBeVisible({ timeout: 20_000 })
  await option.click()
  await page.getByRole('button', { name: /^próximo$|^next$/i }).click()

  const ruleSection = page.getByRole('heading', { name: /definição da regra|rule definition/i }).locator('xpath=ancestor::section[1]')
  await ruleSection.locator('input').first().fill(ruleName)
  await ruleSection.locator('select').nth(0).selectOption('fixo')
  await ruleSection.locator('select').nth(1).selectOption('todos')
  await ruleSection.locator('select').nth(2).selectOption('todos')
  await ruleSection.locator('input').nth(4).fill('10,00')
  await page.getByRole('button', { name: /^próximo$|^next$/i }).click()

  await page.getByRole('button', { name: /^próximo$|^next$/i }).click()
  await expect(page.getByText(/combinações|combinations/i)).toBeVisible()

  await page.getByRole('button', { name: /^save$|^salvar$/i }).last().click()
  await expect(page).toHaveURL(/\/produtos-x-precificadores\/.+\/editar$/, { timeout: 30_000 })

  await page.goto('/produtos-x-precificadores', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /filtros|filters/i }).click()
  await page.getByRole('textbox', { name: /^nome$/i }).fill(ruleName)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(ruleName, { timeout: 30_000 })

  await page.locator('tbody tr').first().locator('button').last().click()
  await page.getByRole('button', { name: /delete|excluir/i }).click()
})
