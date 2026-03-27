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

async function ensureFiltersVisible(page: Page) {
  const applyButton = page.getByRole('button', { name: /aplicar filtros|apply filters/i })
  if (await applyButton.isVisible().catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).first().click()
  await expect(applyButton).toBeVisible({ timeout: 20_000 })
}

async function openDeliveryMethods(page: Page) {
  await openModuleFromMenu(page, {
    parents: [/log.stica|logistics/i],
    linkName: /formas de entrega|delivery methods/i,
    urlPattern: /\/formas-de-entrega(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
}

async function filterByName(page: Page, name: string) {
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^Nome$/i }).fill(name)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(name, { timeout: 30_000 })
}

async function toggleMultiLookup(page: Page, label: RegExp) {
  const field = page.locator('label').filter({ has: page.getByText(label, { exact: true }) }).last()
  await field.locator('button[type="button"]').first().click()
}

async function selectFirstMultiLookupOption(page: Page, placeholder: RegExp) {
  const dropdown = page.locator('body > div').filter({ has: page.getByPlaceholder(placeholder) }).last()
  await expect(dropdown).toBeVisible({ timeout: 30_000 })
  await dropdown.locator('button').nth(1).click()
}

async function expectDateCreatedOrUnavailable(page: Page, date: string) {
  const row = page.locator('tbody tr').first()
  const unavailableMessage = page.getByText(/datas excepcionais indisponiveis para esta empresa|exceptional dates are unavailable for this tenant/i)
  const dateCell = row.getByText(date)

  await Promise.race([
    dateCell.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null),
    unavailableMessage.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null),
  ])

  if (await unavailableMessage.isVisible().catch(() => false)) {
    return true
  }

  await expect(row).toContainText(date, { timeout: 30_000 })
  return false
}

test('creates, validates tabs and deletes a delivery method through the UI', async ({ page }) => {
  const suffix = Date.now()
  const name = `Entrega E2E ${suffix}`

  await openDeliveryMethods(page)
  await page.getByRole('link', { name: /novo|new/i }).click()

  await fieldInput(page, /^Nome$/i).fill(name)
  await fieldInput(page, /^Posi..o|Position$/i).fill('10')
  await fieldInput(page, /^Prioridade|Priority$/i).fill('3')
  await fieldRow(page, /^Tipo$/i).locator('select').selectOption('retira')
  await fieldRow(page, /^Perfil de usu.rio|User profile$/i).locator('select').selectOption('cliente')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()

  await expect(page).toHaveURL(/\/formas-de-entrega\/[^/]+\/editar$/, { timeout: 30_000 })

  await page.getByRole('button', { name: /regras|rules/i }).click()
  await expect(page.locator('tbody').getByText(/nenhuma regra foi cadastrada|no rules were created/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /incluir|novo|add|new/i }).click()
  await page.getByRole('textbox', { name: /nome da regra|rule name/i }).last().fill(`Regra ${suffix}`)
  await page.getByRole('combobox', { name: /^tipo$/i }).last().selectOption('km')
  await page.getByRole('textbox', { name: /km inicial|km start/i }).last().fill('1')
  await page.getByRole('textbox', { name: /km final|km end/i }).last().fill('15')
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page.locator('tbody tr').filter({ hasText: `Regra ${suffix}` }).first()).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: /incluir|novo|add|new/i }).click()
  await page.getByRole('textbox', { name: /nome da regra|rule name/i }).last().fill(`Local ${suffix}`)
  await page.getByRole('combobox', { name: /^tipo$/i }).last().selectOption('local')
  await toggleMultiLookup(page, /^Estados|States$/i)
  await page.getByPlaceholder(/buscar estados|search states/i).fill('CE')
  await page.getByRole('button', { name: /ce - cear|ce - ceará/i }).click()
  await toggleMultiLookup(page, /^Cidades|Cities$/i)
  await selectFirstMultiLookupOption(page, /buscar cidades|search cities/i)
  await toggleMultiLookup(page, /^Bairros|Districts$/i)
  await selectFirstMultiLookupOption(page, /buscar bairros|search districts/i)
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page.locator('tbody tr').filter({ hasText: `Local ${suffix}` }).first()).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /filtros|filters|ocultar filtros/i }).click()
  await page.getByRole('textbox', { name: /regra|rule/i }).fill(`Local ${suffix}`)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(`Local ${suffix}`, { timeout: 30_000 })
  await page.getByRole('button', { name: /filtros|filters/i }).click()
  await page.getByRole('button', { name: /limpar|clear/i }).click()

  await page.getByRole('button', { name: /agendamento|scheduling/i }).click()
  await expect(page.getByText(/datas excepcionais|exceptional dates/i).first()).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /editar|edit/i }).first().click()
  await page.getByRole('textbox', { name: /m[ií]nimo de dias|min/i }).fill('2')
  await page.getByRole('textbox', { name: /m[aá]ximo de dias|max/i }).fill('5')
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page.getByText(/^2$/)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /incluir|novo|add|new/i }).click()
  await page.getByRole('textbox', { name: /data|date/i }).last().fill('2026-12-24')
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  const dateUnavailable = await expectDateCreatedOrUnavailable(page, '2026-12-24')
  if (dateUnavailable) {
    await page.getByRole('button', { name: /cancelar|cancel/i }).last().click()
  }

  await page.getByRole('button', { name: /restri..es|restrictions/i }).click()
  await page.getByRole('button', { name: /incluir|novo|add|new/i }).click()
  await page.getByRole('combobox', { name: /^tipo$/i }).last().selectOption('todos')
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page.locator('tbody tr').filter({ hasText: /todos|all/i }).first()).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: /exce..es|exceptions/i }).click()
  await page.getByRole('button', { name: /incluir|novo|add|new/i }).click()
  await page.getByRole('combobox', { name: /^tipo$/i }).last().selectOption('uf')
  await page.getByRole('combobox').last().selectOption('CE')
  await page.getByRole('button', { name: /salvar|save/i }).last().click()
  await expect(page.locator('tbody tr').filter({ hasText: /UF/ }).filter({ hasText: /CE/ }).first()).toBeVisible({ timeout: 30_000 })

  await openDeliveryMethods(page)
  await filterByName(page, name)
  await page.locator('tbody tr').first().locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
})
