import { expect, test } from '@playwright/test'
import { fieldInput, openFirstFilteredRowForEdit } from '@/e2e/helpers/crud'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

test('creates, filters and edits parameter records through the UI', async ({ page }) => {
	const suffix = Date.now()
	const key = `parametro_${suffix}`
	const name = `Parâmetro ERP ${suffix}`

	await page.goto('/integracao-com-erp/cadastros/parametros-cadastro', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000,
	})
	await waitForProtectedShell(page)
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/parametros-cadastro(?:\?|$)/, { timeout: 60_000 })

	await page.getByRole('link', { name: /novo|new/i }).click()
	await page.getByRole('button', { name: /^grupo$/i }).click()
	await page.getByRole('option').first().click()
	await fieldInput(page, /^chave$/i).fill(key)
	await fieldInput(page, /^nome$/i).fill(name)
	await page.getByRole('combobox', { name: /^tipo entrada$/i }).selectOption('livre')
	await page.getByRole('combobox', { name: /^tipo valor$/i }).selectOption('texto')
	await page.getByRole('button', { name: /salvar|save/i }).first().click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/parametros-cadastro(?:\?|$)/, { timeout: 30_000 })

	await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click().catch(() => undefined)
	await page.getByRole('textbox', { name: /^chave$/i }).fill(key)
	await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
	await expect(page.locator('tbody tr').first()).toContainText(key, { timeout: 30_000 })

	await openFirstFilteredRowForEdit(page, /\/integracao-com-erp\/cadastros\/parametros-cadastro\/[^/]+\/editar$/)
	await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
	await page.getByRole('button', { name: /salvar|save/i }).first().click()
	await expect(page).toHaveURL(/\/integracao-com-erp\/cadastros\/parametros-cadastro(?:\?|$)/, { timeout: 30_000 })
})
