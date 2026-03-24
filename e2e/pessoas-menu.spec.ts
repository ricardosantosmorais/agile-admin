import { expect, test, type Locator, type Page } from '@playwright/test'
import { openModuleFromMenu } from '@/e2e/helpers/auth'

test.setTimeout(180_000)

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
  const applyButton = page.getByRole('button', { name: /aplicar filtros/i })
  if (await applyButton.isVisible().catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: /filtros|ocultar filtros/i }).first().click()
  await expect(applyButton).toBeVisible({ timeout: 20_000 })
}

async function deleteFirstFilteredRow(page: Page) {
  const row = page.locator('tbody tr').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
}

async function createSimpleCrudRecord(
  page: Page,
  {
    parents,
    linkName,
    urlPattern,
    code,
    name,
  }: {
    parents: RegExp[]
    linkName: RegExp
    urlPattern: RegExp
    code: string
    name: string
  },
) {
  await openModuleFromMenu(page, {
    parents,
    linkName,
    urlPattern,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await expect(page.getByRole('button', { name: /salvar|save/i }).first()).toBeVisible({ timeout: 30_000 })

  await fieldInput(page, /^C[oó]digo$/i).fill(code)
  await fieldInput(page, /^Nome$/i).fill(name)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()

  await expect(page).toHaveURL(urlPattern, { timeout: 30_000 })
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^Código$/i }).fill(code)
  await page.getByRole('button', { name: /aplicar filtros/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(code, { timeout: 30_000 })

  await deleteFirstFilteredRow(page)
}

test('creates and deletes customer network, customer segment and registration rule through the UI', async ({ page }) => {
  const suffix = Date.now()

  await createSimpleCrudRecord(page, {
    parents: [/pessoas|people/i],
    linkName: /^redes de cliente|customer networks?$/i,
    urlPattern: /\/redes-clientes(?:\?|$)/,
    code: `RED-${suffix}`,
    name: `Rede E2E ${suffix}`,
  })

  await createSimpleCrudRecord(page, {
    parents: [/pessoas|people/i],
    linkName: /^segmentos de cliente|customer segments?$/i,
    urlPattern: /\/segmentos-clientes(?:\?|$)/,
    code: `SEG-${suffix}`,
    name: `Segmento E2E ${suffix}`,
  })

  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^regras de cadastro|registration rules$/i,
    urlPattern: /\/regras-de-cadastro(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await fieldInput(page, /^Nome$/i).fill(`Regra E2E ${suffix}`)
  await fieldInput(page, /^Código$/i).fill(`REG-${suffix}`)
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await page.waitForURL(/\/regras-de-cadastro\/[^/]+\/editar$/, { timeout: 30_000 })

  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^regras de cadastro|registration rules$/i,
    urlPattern: /\/regras-de-cadastro(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^Código$/i }).fill(`REG-${suffix}`)
  await page.getByRole('button', { name: /aplicar filtros/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(`REG-${suffix}`, { timeout: 30_000 })
  await deleteFirstFilteredRow(page)
})

test('opens contacts list and details modal when rows are available', async ({ page }) => {
  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^contatos|contacts$/i,
    urlPattern: /\/contatos(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  const emptyState = page.getByText(/nenhum contato encontrado|no contacts found/i)
  if (await emptyState.isVisible().catch(() => false)) {
    return
  }

  const firstActionButton = page.locator('tbody tr').locator('button[aria-haspopup="menu"]').first()
  if ((await firstActionButton.count()) === 0) {
    return
  }

  await firstActionButton.click()
  await page.getByRole('menuitem', { name: /informações|details|contact information/i }).click()
  await expect(page.getByRole('heading', { name: /informações do contato|contact information/i })).toBeVisible({ timeout: 30_000 })
})

test('opens existing people modules and reaches their main operational flows', async ({ page }) => {
  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^clientes|customers$/i,
    urlPattern: /\/clientes(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  const customerRow = page.locator('tbody tr').first()
  if ((await customerRow.count()) > 0) {
    await customerRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/clientes\/[^/]+\/editar$/, { timeout: 30_000 })
    await expect(page.getByRole('button', { name: /dados gerais|general data/i })).toBeVisible({ timeout: 30_000 })
  }

  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^vendedores|sellers$/i,
    urlPattern: /\/vendedores(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  const sellerRow = page.locator('tbody tr').first()
  if ((await sellerRow.count()) > 0) {
    await sellerRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/vendedores\/[^/]+\/editar$/, { timeout: 30_000 })
    await expect(page.getByRole('button', { name: /dados gerais|general data/i })).toBeVisible({ timeout: 30_000 })
  }

  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^supervisores|supervisors$/i,
    urlPattern: /\/supervisores(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  const supervisorRow = page.locator('tbody tr').first()
  if ((await supervisorRow.count()) > 0) {
    await supervisorRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/supervisores\/[^/]+\/editar$/, { timeout: 30_000 })
    await expect(page.getByText(/dados principais|main data/i).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('form, main').getByText(/nome|name/i).first()).toBeVisible({ timeout: 30_000 })
  }

  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^grupos de clientes?|customer groups?$/i,
    urlPattern: /\/grupos-clientes(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  const groupRow = page.locator('tbody tr').first()
  if ((await groupRow.count()) > 0) {
    await groupRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/grupos-clientes\/[^/]+\/editar$/, { timeout: 30_000 })
    await expect(page.getByText(/clientes|customers/i).first()).toBeVisible({ timeout: 30_000 })
  }

  await openModuleFromMenu(page, {
    parents: [/pessoas|people/i],
    linkName: /^usu[aá]rios|users$/i,
    urlPattern: /\/usuarios(?:\?|$)/,
    readyLocator: page.getByRole('button', { name: /atualizar|refresh/i }),
  })

  const userRow = page.locator('tbody tr').first()
  if ((await userRow.count()) > 0) {
    await userRow.locator('a[href*="/senha"]').first().click()
    await expect(page).toHaveURL(/\/usuarios\/[^/]+\/senha$/, { timeout: 30_000 })
    await expect(page.getByText(/nova senha|new password/i).first()).toBeVisible({ timeout: 30_000 })
  }
})
