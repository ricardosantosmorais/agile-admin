import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(120_000)

function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

function fieldRow(page: Page, label: RegExp): Locator {
  return formRoot(page)
    .getByText(label, { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class,"grid")][1]')
}

function fieldInput(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('input').first()
}

function fieldSelect(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('select').first()
}

function fieldButton(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('button[type="button"]').first()
}

function lookupTrigger(page: Page): Locator {
  return fieldButton(page, /^Área$/i)
}

async function openBannersList(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/marketing/i],
    linkName: /^banners$/i,
    urlPattern: /\/banners(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

async function selectFirstLookupOption(page: Page) {
  await lookupTrigger(page).click()

  const dropdown = page.locator('div.fixed.z-\\[240\\]').last()
  await expect(dropdown.locator('input')).toBeVisible({ timeout: 20_000 })

  const firstOption = dropdown.locator('button').nth(1)
  await expect(firstOption).toBeVisible({ timeout: 20_000 })
  await firstOption.click()
}

async function filterBannerById(page: Page, id: string) {
  const toggleFilters = page.getByRole('button', { name: /filtros|ocultar filtros/i }).first()
  const applyButton = page.getByRole('button', { name: /aplicar filtros/i })

  if (!(await applyButton.isVisible().catch(() => false))) {
    await toggleFilters.click()
  }

  await page.getByRole('textbox', { name: /^ID$/i }).fill(id)
  await applyButton.click()
}

test('creates a banner, shows it in the list and deletes it from the table', async ({ page }) => {
  const uniqueCode = `BNR-${Date.now()}`
  const uniqueTitle = `Banner E2E ${uniqueCode}`

  await openBannersList(page)

  await page.getByRole('link', { name: /novo/i }).click()
  await expect(page).toHaveURL(/\/banners\/novo$/, { timeout: 60_000 })
  await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeVisible({ timeout: 60_000 })

  await fieldInput(page, /^Código$/i).fill(uniqueCode)
  await fieldSelect(page, /^Permissão$/i).selectOption('restrito')
  await fieldSelect(page, /^Perfil de usuário$/i).selectOption('cliente')
  await fieldSelect(page, /^Canal de exibição$/i).selectOption('pc_mobile')
  await selectFirstLookupOption(page)
  await fieldInput(page, /^Data\/hora de início$/i).fill('2026-03-23T09:00')
  await fieldInput(page, /^Data\/hora de fim$/i).fill('2026-03-24T18:00')
  await fieldInput(page, /^Posição$/i).fill('10')
  await fieldInput(page, /^Título$/i).fill(uniqueTitle)

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/banners\/[^/]+\/editar$/, { timeout: 60_000 })

  const match = page.url().match(/\/banners\/([^/]+)\/editar$/)
  const savedId = match?.[1] ?? null
  expect(savedId).not.toBeNull()

  await expect(fieldInput(page, /^Código$/i)).toHaveValue(uniqueCode)
  await expect(fieldInput(page, /^Título$/i)).toHaveValue(uniqueTitle)
  await expect(fieldSelect(page, /^Permissão$/i)).toHaveValue('restrito')
  await expect(fieldSelect(page, /^Canal de exibição$/i)).toHaveValue('pc_mobile')

  await openBannersList(page)
  await filterBannerById(page, savedId!)

  const savedRow = page.locator('tbody tr').filter({ hasText: savedId! }).first()
  await expect(savedRow).toBeVisible({ timeout: 30_000 })
  await expect(savedRow).toContainText(uniqueTitle)

  await savedRow.locator('button').last().click()
  await expect(page.getByText(/excluir registro\?|delete record\?/i)).toBeVisible()
  await page.getByRole('button', { name: /excluir|delete/i }).click()

  await expect(page.locator('tbody tr').filter({ hasText: savedId! })).toHaveCount(0)
})
