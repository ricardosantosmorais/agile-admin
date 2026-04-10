import { expect, test } from '@playwright/test'
import { fieldInput, openCrudModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('opens e-mail templates editor tab and loads model/preview controls', async ({ page }) => {
  await openCrudModule(page, {
    parents: [/manuten(?:c|ç)[aã]o|maintenance/i],
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
  await expect(page.getByRole('button', { name: /^twig$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^php$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /atualizar vari[aá]veis|refresh variables/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /hist[oó]rico do template|template history/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /validar c[oó]digo|validate code/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /pr[ée]-visualizar|preview/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /vari[aá]veis dispon[ií]veis|available variables/i })).toBeVisible()

  await page.getByRole('button', { name: /pr[ée]-visualizar|preview/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByTitle(/template preview|preview/i)).toBeVisible()
})
