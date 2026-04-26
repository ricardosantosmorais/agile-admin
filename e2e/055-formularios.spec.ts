import { expect, test } from '@playwright/test'
import { openCrudModule } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

test('shows fields tab only after saving a new form', async ({ page }) => {
  await openCrudModule(page, {
    parents: [/manutenção|manutencao|maintenance/i],
    linkName: /formulários|formularios|forms/i,
    urlPattern: /\/formularios(?:\?.*)?$/,
    path: '/formularios',
  })

  const newButton = page.getByRole('link', { name: /novo|new/i })
  if (!await newButton.isVisible().catch(() => false)) {
    await expect(page).toHaveURL(/\/formularios(?:\?.*)?$/)
    return
  }

  await newButton.click()
  await expect(page).toHaveURL(/\/formularios\/novo$/)
  await expect(page.getByRole('button', { name: /campos|fields/i })).toHaveCount(0)

  const suffix = Date.now()
  const textboxes = page.locator('main input[type="text"], main textarea')
  await textboxes.nth(1).fill(`Formulario E2E ${suffix}`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()

  await expect(page).toHaveURL(/\/formularios\/[^/]+\/editar$/, { timeout: 30_000 })
  await expect(page.getByRole('button', { name: /campos|fields/i })).toBeVisible()
  await page.getByRole('button', { name: /campos|fields/i }).click()
  await expect(page.getByRole('button', { name: /novo campo|new field/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /nova sessão|nova sessao|new section/i })).toBeVisible()
})
