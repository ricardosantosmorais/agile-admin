import { expect, test } from '@playwright/test'
import { fieldInput, filterByCode, openFirstFilteredRowForEdit, selectAt } from '@/e2e/helpers/crud'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('creates, filters and edits templates through the UI', async ({ page }) => {
	const suffix = Date.now()
	const code = `TPL-${suffix}`
	const name = `Template E2E ${suffix}`

	await page.goto('/integracao-com-erp/cadastros/templates', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/templates(?:\?|$)/, { timeout: 60_000 })

	await page.getByRole('link', { name: /novo|new/i }).click()
	await selectAt(page, 0).selectOption({ index: 1 })
	await fieldInput(page, /^c[oó]digo$/i).fill(code)
	await fieldInput(page, /^nome$/i).fill(name)
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
