import { expect, test } from '@playwright/test'
import { fieldInput, filterByCode, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'
import { ensureAgileTenantByUi, expectAccessDenied, isAccessDenied, waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('creates, filters and edits templates through the UI @agile', async ({ page }) => {
  const suffix = Date.now()
  const code = `TPL-${suffix}`
  const name = `Template E2E ${suffix}`

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await ensureAgileTenantByUi(page)

  await page.goto('/integracao-com-erp/cadastros/templates', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await waitForProtectedShell(page)
  await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/templates(?:\?|$)/, { timeout: 60_000 })
  if (await isAccessDenied(page)) {
    await expectAccessDenied(page)
    return
  }

  await page.getByRole('link', { name: /novo|new/i }).click()
  await page.getByRole('button', { name: /selecione erp|select erp/i }).click()
  await page.getByRole('listbox').last().getByRole('option').first().click()
  const inputs = page.locator('main input')
  await inputs.nth(1).fill(code)
  await inputs.nth(2).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/templates(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await openFirstFilteredRowForEdit(page, /\/integracao-com-erp\/cadastros\/templates\/[^/]+\/editar$/)
  await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/templates(?:\?|$)/, { timeout: 30_000 })

  await filterByCode(page, code)
  await expect(page.locator('tbody tr').first()).toContainText(`${name} Editado`, { timeout: 30_000 })
})
