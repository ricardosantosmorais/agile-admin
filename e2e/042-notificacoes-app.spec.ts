import { expect, test, type Locator, type Page } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.setTimeout(90_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function formTextInput(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="text"]').nth(index)
}

function formTextArea(page: Page): Locator {
  return formRoot(page).locator('textarea').first()
}

function formDateTimeInput(page: Page): Locator {
  return formRoot(page).locator('input[type="datetime-local"]').first()
}

async function openNotificationsList(page: Page) {
  await page.goto('/notificacoes-app', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await expect(page).toHaveURL(/\/notificacoes-app(?:\?|$)/, { timeout: 60_000 })
  await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 15_000 })
}

async function ensureFiltersVisible(page: Page) {
  const applyButton = page.getByRole('button', { name: /aplicar filtros|apply filters/i })
  if (await applyButton.isVisible().catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await expect(applyButton).toBeVisible({ timeout: 10_000 })
}

test('lists, creates, filters and deletes an app notification through the UI', async ({ page }) => {
  const uniqueTitle = `Notificacao E2E ${Date.now()}`
  const uniqueLink = `https://example.com/${Date.now()}`

  await openNotificationsList(page)

  await expect(page.locator('tbody')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('link', { name: /^novo$|^new$/i }).click()
  await expect(page).toHaveURL(/\/notificacoes-app\/novo$/, { timeout: 60_000 })
  await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeVisible({ timeout: 60_000 })

  await formTextInput(page, 0).fill(uniqueTitle)
  await formTextArea(page).fill(`Mensagem de teste ${uniqueTitle}`)
  await formDateTimeInput(page).fill('2026-12-24T10:30')
  await formTextInput(page, 1).fill(uniqueLink)

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/notificacoes-app\/[^/]+\/editar$/, { timeout: 60_000 })
  await expect(formTextInput(page, 0)).toHaveValue(uniqueTitle)

  await openNotificationsList(page)
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /t.tulo|title/i }).fill(uniqueTitle)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()

  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueTitle }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await expect(savedRow).toContainText(uniqueTitle)

  await savedRow.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()

  await expect(page.locator('tbody tr').filter({ hasText: uniqueTitle })).toHaveCount(0)
})
