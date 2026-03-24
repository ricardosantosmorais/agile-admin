import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(240_000)

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

function lookupTrigger(page: Page, label: RegExp): Locator {
  return fieldRow(page, label).locator('button').first()
}

async function ensureFiltersVisible(page: Page) {
  const applyButton = page.getByRole('button', { name: /aplicar filtros|apply filters/i })
  if (await applyButton.isVisible().catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await expect(applyButton).toBeVisible({ timeout: 20_000 })
}

async function deleteFirstFilteredRow(page: Page) {
  const row = page.locator('tbody tr').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
}

async function isModuleUnavailable(page: Page) {
  return page.getByRole('heading', { name: /não foi possível carregar os dados|could not load the data/i }).isVisible().catch(() => false)
}

async function openSimpleModule(page: Page, linkName: RegExp, urlPattern: RegExp) {
  await openModuleFromMenu(page, {
    parents: [/logística|logistics/i],
    linkName,
    urlPattern,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

async function filterByCode(page: Page, code: string) {
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^C[oó]digo$/i }).fill(code)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(code, { timeout: 30_000 })
}

async function pickLookupOption(page: Page, label: RegExp, optionText: RegExp) {
  await lookupTrigger(page, label).click()
  await page.getByRole('textbox').last().fill('')
  await page.getByRole('button').filter({ hasText: optionText }).first().click()
}

test('creates and deletes logistics base records through the UI', async ({ page }) => {
  const suffix = Date.now()

  await openSimpleModule(page, /^portos|ports$/i, /\/portos(?:\?|$)/)
  test.skip(await isModuleUnavailable(page), 'A empresa autenticada não expõe as tabelas de logística na API atual.')
  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^C[oó]digo$/i).fill(`PORT-${suffix}`)
  await fieldInput(page, /^Nome$/i).fill(`Porto E2E ${suffix}`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/portos(?:\?|$)/, { timeout: 30_000 })
  await filterByCode(page, `PORT-${suffix}`)
  await deleteFirstFilteredRow(page)

  await openSimpleModule(page, /^rotas|routes$/i, /\/rotas(?:\?|$)/)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^C[oó]digo$/i).fill(`ROT-${suffix}`)
  await fieldInput(page, /^Nome$/i).fill(`Rota E2E ${suffix}`)
  await fieldInput(page, /^Hor[aá]rio de corte|cutoff time$/i).fill('18:00')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/rotas(?:\?|$)/, { timeout: 30_000 })
  await filterByCode(page, `ROT-${suffix}`)
  await page.locator('tbody tr').first().locator('a').first().click()
  await expect(page).toHaveURL(/\/rotas\/[^/]+\/editar$/, { timeout: 30_000 })
  await expect(page.getByText(/dias de entrega|delivery days/i).first()).toBeVisible({ timeout: 30_000 })

  await openSimpleModule(page, /^pr[aá]ças|market areas$/i, /\/pracas(?:\?|$)/)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^C[oó]digo$/i).fill(`PRA-${suffix}`)
  await fieldInput(page, /^Nome$/i).fill(`Praça E2E ${suffix}`)
  await pickLookupOption(page, /^Rota$/i, /rota e2e|rot-/i)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/pracas(?:\?|$)/, { timeout: 30_000 })
  await filterByCode(page, `PRA-${suffix}`)

  await openSimpleModule(page, /^áreas de atuação|areas de atuação|coverage areas$/i, /\/areas-de-atuacao(?:\?|$)/)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^C[oó]digo$/i).fill(`AREA-${suffix}`)
  await fieldInput(page, /^Nome$/i).fill(`Área E2E ${suffix}`)
  await pickLookupOption(page, /^Praça$/i, /praça e2e|pra-/i)
  await fieldInput(page, /^CEP inicial|zip start$/i).fill('60000-000')
  await fieldInput(page, /^CEP final|zip end$/i).fill('60199-999')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/areas-de-atuacao(?:\?|$)/, { timeout: 30_000 })
  await filterByCode(page, `AREA-${suffix}`)

  await openSimpleModule(page, /^transportadoras|carriers$/i, /\/transportadoras(?:\?|$)/)
  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^C[oó]digo$/i).fill(`TRA-${suffix}`)
  await fieldInput(page, /^CPF$/i).fill('12345678909')
  await fieldInput(page, /^Nome completo|full name$/i).fill(`Transportadora E2E ${suffix}`)
  await fieldInput(page, /^E-mail$/i).fill(`transportadora.${suffix}@example.com`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/transportadoras(?:\?|$)/, { timeout: 30_000 })

  for (const [linkName, urlPattern, code] of [
    [/^transportadoras|carriers$/i, /\/transportadoras(?:\?|$)/, `TRA-${suffix}`],
    [/^áreas de atuação|areas de atuação|coverage areas$/i, /\/areas-de-atuacao(?:\?|$)/, `AREA-${suffix}`],
    [/^pr[aá]ças|market areas$/i, /\/pracas(?:\?|$)/, `PRA-${suffix}`],
    [/^rotas|routes$/i, /\/rotas(?:\?|$)/, `ROT-${suffix}`],
  ] as const) {
    await openSimpleModule(page, linkName, urlPattern)
    await filterByCode(page, code)
    await deleteFirstFilteredRow(page)
  }
})
