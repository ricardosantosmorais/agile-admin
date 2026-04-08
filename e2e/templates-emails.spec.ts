import { expect, test } from '@playwright/test'
import { fieldInput, openCrudModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens e-mail templates editor tab and loads model/preview controls', async ({ page }) => {
  await openCrudModule(page, {
    parents: [/manutenção|manutencao|maintenance/i],
    linkName: /templates de e-mails|e-mail templates/i,
    urlPattern: /\/templates-de-emails(?:\?|$)/,
    path: '/templates-de-emails',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page).toHaveURL(/\/templates-de-emails\/novo$/, { timeout: 30_000 })

  const suffix = Date.now()
  await fieldInput(page, /t[ií]tulo|title/i).fill(`Template E2E ${suffix}`)
  await page.locator('form select').first().selectOption('pedido_aprovado')

  await page.getByRole('button', { name: /^editor$/i }).click()
  await expect(page.getByRole('button', { name: /converter para twig|convert to twig/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /pr[ée]-visualizar|preview/i })).toBeVisible()
  await expect(page.getByText(/vari[aá]veis dispon[ií]veis|available variables/i)).toBeVisible()
})
