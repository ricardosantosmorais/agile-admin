import { expect, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu, waitForProtectedShell } from '@/e2e/helpers/auth'

export function formRoot(page: Page): Locator {
  return page.locator('form').first()
}

export function fieldRow(page: Page, label: RegExp): Locator {
  return formRoot(page)
    .getByText(label, { exact: true })
    .first()
    .locator('xpath=ancestor::div[.//input or .//select or .//textarea or .//button][1]')
}

export function fieldInput(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('input').first()
}

export function fieldSelect(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('select').first()
}

export function fieldDateInput(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('input[type="date"]').first()
}

export function fieldNumberInput(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('input[type="number"]').first()
}

export function fieldButton(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('button').first()
}

async function lookupPanel(page: Page) {
  const search = page.getByRole('combobox', { name: /buscar|search/i }).last()
  await expect(search).toBeVisible({ timeout: 10_000 })

  const panel = page.getByRole('listbox').last()
  await expect(panel).toBeVisible({ timeout: 10_000 })

  return { search, panel }
}

export function textInputAt(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="text"]').nth(index)
}

export function dateInputAt(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="date"]').nth(index)
}

export function numberInputAt(page: Page, index: number): Locator {
  return formRoot(page).locator('input[type="number"]').nth(index)
}

export function selectAt(page: Page, index: number): Locator {
  return formRoot(page).locator('select').nth(index)
}

export async function ensureFiltersVisible(page: Page) {
  const applyButton = page.getByRole('button', { name: /aplicar filtros|apply filters/i })
  if (await applyButton.isVisible().catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await expect(applyButton).toBeVisible({ timeout: 20_000 })
}

export async function filterByCode(page: Page, code: string) {
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^c[oó]digo$/i }).fill(code)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(code, { timeout: 30_000 })
}

export async function deleteFirstFilteredRow(page: Page) {
  const row = page.locator('tbody tr').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
}

export async function pickLookupOption(page: Page, label: RegExp, optionText: RegExp) {
  await fieldButton(page, label).click()
  const { search, panel } = await lookupPanel(page)
  await search.fill('')
  const option = panel.getByRole('option', { name: optionText }).first()
  await expect(option).toBeVisible({ timeout: 20_000 })
  await option.scrollIntoViewIfNeeded()
  await option.click()
}

export async function pickFirstLookupOption(page: Page, label: RegExp, query = '') {
  await fieldButton(page, label).click()
  const { search, panel } = await lookupPanel(page)
  await search.fill(query)
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const directMatch = query
    ? panel.getByRole('option', { name: new RegExp(escapedQuery, 'i') }).first()
    : null

  if (directMatch && await directMatch.isVisible().catch(() => false)) {
    const text = (await directMatch.textContent())?.trim() || ''
    await directMatch.click()
    return text
  }

  const option = panel.getByRole('option').first()
  await expect(option).toBeVisible({ timeout: 20_000 })
  await option.scrollIntoViewIfNeeded()
  const text = (await option.textContent())?.trim() || ''
  await option.click()
  return text
}

export async function openCrudModule(
  page: Page,
  {
    parents,
    linkName,
    urlPattern,
    path,
  }: {
    parents: readonly RegExp[]
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  try {
    await openModuleFromMenu(page, {
      parents: [...parents],
      linkName,
      urlPattern,
      readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
    })
  } catch {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)
    await expect(page).toHaveURL(urlPattern, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 60_000 })
  }
}

export async function openPeopleModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/pessoas|people/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openLogisticsModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/logística|logistics/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openFinancialModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/financeiro|financial/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openBasicRecordsModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/cadastros básicos|basic records/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openPromotionsModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/promoções|promocoes|promotions/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openPriceStockModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/pre[cç]os e estoques|prices and inventory/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openCatalogModule(
  page: Page,
  {
    linkName,
    urlPattern,
    path,
  }: {
    linkName: RegExp
    urlPattern: RegExp
    path: string
  },
) {
  await openCrudModule(page, {
    parents: [/cat[aá]logo|catalog/i],
    linkName,
    urlPattern,
    path,
  })
}

export async function openFirstFilteredRowForEdit(page: Page, urlPattern: RegExp) {
  const row = page.locator('tbody tr').first()
  const editLink = row.locator('a[href*="/editar"]').first()

  if (await editLink.isVisible().catch(() => false)) {
    await editLink.click()
  } else {
    await row.locator('a').first().click()
  }

  await expect(page).toHaveURL(urlPattern, { timeout: 30_000 })
}

export async function isModuleUnavailable(page: Page) {
  return page.getByRole('heading', { name: /não foi possível carregar os dados|could not load the data/i }).isVisible().catch(() => false)
}
