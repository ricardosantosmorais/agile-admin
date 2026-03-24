import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

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
  await openModuleFromMenu(page, {
    parents: [/marketing/i],
    linkName: /notificações app|app notifications/i,
    urlPattern: /\/notificacoes-app(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

test('creates an app notification, shows it in the list and deletes it from the table', async ({ page }) => {
  const uniqueTitle = `Notificação E2E ${Date.now()}`
  const uniqueLink = `https://example.com/${Date.now()}`

  await openNotificationsList(page)

  await page.getByRole('link', { name: /novo/i }).click()
  await expect(page).toHaveURL(/\/notificacoes-app\/novo$/, { timeout: 60_000 })
  await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeVisible({ timeout: 60_000 })

  await formTextInput(page, 0).fill(uniqueTitle)
  await formTextArea(page).fill(`Mensagem de teste ${uniqueTitle}`)
  await formDateTimeInput(page).fill('2026-03-24T10:30')
  await formTextInput(page, 1).fill(uniqueLink)

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/notificacoes-app\/[^/]+\/editar$/, { timeout: 60_000 })

  const match = page.url().match(/\/notificacoes-app\/([^/]+)\/editar$/)
  const savedId = match?.[1] ?? null
  expect(savedId).not.toBeNull()

  await expect(formTextInput(page, 0)).toHaveValue(uniqueTitle)

  await openNotificationsList(page)

  const savedRow = page.locator('tbody tr').filter({ hasText: uniqueTitle }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await expect(savedRow).toContainText(uniqueTitle)

  await savedRow.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()

  await expect(page.locator('tbody tr').filter({ hasText: uniqueTitle })).toHaveCount(0)
})
