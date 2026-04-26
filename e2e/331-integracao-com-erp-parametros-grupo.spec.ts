import { expect, test } from '@playwright/test'
import { fieldInput, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'
import { ensureAgileTenantByUi, expectAccessDenied, isAccessDenied, waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('creates, filters and edits parameter groups through the UI @agile', async ({ page }) => {
	const suffix = Date.now()
	const name = `Grupo ERP ${suffix}`

	await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
	await waitForProtectedShell(page)
	await ensureAgileTenantByUi(page)

	await page.goto('/integracao-com-erp/cadastros/parametros-grupo', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/parametros-grupo(?:\?|$)/, { timeout: 60_000 })
	if (await isAccessDenied(page)) {
		await expectAccessDenied(page)
		return
	}

	await page.getByRole('link', { name: /novo|new/i }).click()
	await fieldInput(page, /^nome$/i).fill(name)
	await page.getByRole('spinbutton').first().fill('10')
	await page.getByRole('button', { name: /salvar|save/i }).first().click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/parametros-grupo(?:\?|$)/, { timeout: 30_000 })

	await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click().catch(() => undefined)
	await page.getByRole('textbox', { name: /^nome$/i }).fill(name)
	await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
	await expect(page.locator('tbody tr').first()).toContainText(name, { timeout: 30_000 })

	await openFirstFilteredRowForEdit(page, /\/integracao-com-erp\/cadastros\/parametros-grupo\/[^/]+\/editar$/)
	await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
	await page.getByRole('button', { name: /salvar|save/i }).first().click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/parametros-grupo(?:\?|$)/, { timeout: 30_000 })
})
