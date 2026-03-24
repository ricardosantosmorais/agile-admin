import { expect, type Locator, type Page } from '@playwright/test'

function getAuthConfig() {
  const email = process.env.PLAYWRIGHT_AUTH_EMAIL || ''
  const password = process.env.PLAYWRIGHT_AUTH_PASSWORD || ''

  if (!email || !password) {
    throw new Error('Defina PLAYWRIGHT_AUTH_EMAIL e PLAYWRIGHT_AUTH_PASSWORD para executar os testes E2E autenticados.')
  }

  return {
    email,
    password,
    code: process.env.PLAYWRIGHT_AUTH_CODE || '',
    tenantId: process.env.PLAYWRIGHT_AUTH_TENANT_ID || '',
  }
}

async function openTenantPanel(page: Page) {
  const tenantSearch = page.getByPlaceholder(/buscar empresa|search company/i)

  if (await tenantSearch.isVisible().catch(() => false)) {
    return tenantSearch
  }

  const tenantButton = page.getByRole('button', { name: / - / }).first()
  await expect(tenantButton).toBeVisible({ timeout: 30_000 })
  await tenantButton.click()
  await expect(tenantSearch).toBeVisible({ timeout: 30_000 })

  return tenantSearch
}

export async function waitForProtectedShell(page: Page) {
  await expect(
    page.getByRole('textbox', { name: /acesso rápido por funcionalidades/i }),
  ).toBeVisible({ timeout: 60_000 })

  const loadingState = page.getByRole('heading', { name: /carregando dados|loading data/i })
  if (await loadingState.isVisible().catch(() => false)) {
    await loadingState.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined)
  }
}

export async function loginWithUi(page: Page) {
  const { email, password, code, tenantId } = getAuthConfig()

  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })

  await page.getByRole('button', { name: /continuar|continue/i }).waitFor({ state: 'visible', timeout: 30_000 })

  const emailInput = page.getByLabel(/e-mail|email/i).or(page.locator('input').first())
  await emailInput.fill(email)
  await page.getByLabel(/senha|password/i).or(page.locator('input[type="password"]')).fill(password)
  await page.getByRole('button', { name: /continuar|continue/i }).click()

  const codeInput = page.locator('input[maxlength="6"]')
  if (await codeInput.isVisible().catch(() => false)) {
    if (!code) {
      throw new Error('PLAYWRIGHT_AUTH_CODE não foi definido para um fluxo com autenticação em duas etapas.')
    }

    await codeInput.fill(code)
    await page.getByRole('button', { name: /validar código|validate code/i }).click()
  }

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 90_000 })
  await waitForProtectedShell(page)

  if (tenantId) {
    await ensureTenantByUi(page, tenantId)
  }
}

export async function ensureTenantByUi(page: Page, tenantId: string) {
  const tenantButton = page.getByRole('button', { name: / - / }).first()
  await expect(tenantButton).toBeVisible({ timeout: 30_000 })

  if ((await tenantButton.textContent())?.includes(tenantId)) {
    return
  }

  const tenantSearch = await openTenantPanel(page)
  await tenantSearch.fill(tenantId)

  const tenantOption = page.getByRole('button', { name: new RegExp(tenantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()
  await expect(tenantOption).toBeVisible({ timeout: 30_000 })
  await tenantOption.click()

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 60_000 })
  await waitForProtectedShell(page)
  await expect(tenantButton).toContainText(tenantId, { timeout: 30_000 })
}

export async function openModuleFromMenu(
  page: Page,
  {
    parents = [],
    linkName,
    urlPattern,
    readyLocator,
  }: {
    parents?: RegExp[]
    linkName: RegExp
    urlPattern: RegExp
    readyLocator: Locator
  },
) {
  await page.goto('/dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })

  await waitForProtectedShell(page)

  const link = page.getByRole('link', { name: linkName }).first()

  for (const parent of parents) {
    if (await link.isVisible().catch(() => false)) {
      break
    }

    const groupButton = page.getByRole('button', { name: parent }).first()
    if (await groupButton.isVisible().catch(() => false)) {
      await groupButton.click()
    }
  }

  await expect(link).toBeVisible({ timeout: 30_000 })
  await link.click()

  await expect(page).toHaveURL(urlPattern, { timeout: 60_000 })
  await expect(readyLocator).toBeVisible({ timeout: 60_000 })

  const loadingState = page.getByRole('heading', { name: /carregando dados|loading data/i })
  if (await loadingState.isVisible().catch(() => false)) {
    await loadingState.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined)
  }
}
