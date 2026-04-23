import { expect, test } from '@playwright/test'
import { fieldInput, filterByCode, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('creates, filters and edits ERPs through the UI', async ({ page }) => {
	const suffix = Date.now()
	const code = `ERP-${suffix}`
	const name = `ERP E2E ${suffix}`

	await page.goto('/integracao-com-erp/cadastros/erps', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/erps(?:\?|$)/, { timeout: 60_000 })

	await page.getByRole('link', { name: /novo|new/i }).click()
	await fieldInput(page, /^c[oó]digo$/i).fill(code)
	await fieldInput(page, /^nome$/i).fill(name)
	await page.getByRole('button', { name: /salvar|save/i }).first().click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/erps(?:\?|$)/, { timeout: 30_000 })

	await filterByCode(page, code)
	await openFirstFilteredRowForEdit(page, /\/integracao-com-erp\/cadastros\/erps\/[^/]+\/editar$/)
	await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
	await page.getByRole('button', { name: /salvar|save/i }).first().click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/erps(?:\?|$)/, { timeout: 30_000 })

	await filterByCode(page, code)
	await expect(page.locator('tbody tr').first()).toContainText(`${name} Editado`, { timeout: 30_000 })
})
