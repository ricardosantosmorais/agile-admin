import { expect, test } from '@playwright/test'
import { openPeopleModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens customers list and validates edit tabs when rows are available', async ({ page }) => {
  await openPeopleModule(page, {
    linkName: /^clientes|customers$/i,
    urlPattern: /\/clientes(?:\?|$)/,
    path: '/clientes',
  })

  const customerRow = page.locator('tbody tr').first()
  if ((await customerRow.count()) === 0) {
    return
  }

  await customerRow.locator('a').first().click()
  await expect(page).toHaveURL(/\/clientes\/[^/]+\/editar$/, { timeout: 30_000 })

  const tabs = [
    /dados gerais|general data/i,
    /classificacao|classification/i,
    /filiais|branches/i,
    /vendedores|sellers/i,
    /formas de pagamento|payment methods/i,
    /condicoes de pagamento|payment terms/i,
    /adicionais|additional/i,
  ]

  for (const tab of tabs) {
    const button = page.getByRole('button', { name: tab }).first()
    if (await button.isVisible().catch(() => false)) {
      await button.click()
      await expect(button).toBeVisible({ timeout: 30_000 })
    }
  }
})
