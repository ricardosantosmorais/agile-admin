import { expect, type Locator, type Page } from '@playwright/test'
import { attachApiProblemRecorder } from '@/e2e/helpers/api-problems'

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

async function waitForDashboardOrLoginError(page: Page) {
  const loginError = page.getByText(/e-mail ou senha incorretos|incorrect e-mail or password|invalid credentials/i)

  const outcome = await Promise.race([
    page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 }).then(() => 'dashboard' as const).catch(() => 'timeout' as const),
    loginError.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'login-error' as const).catch(() => 'timeout' as const),
  ])

  if (outcome === 'login-error') {
    const message = (await loginError.textContent())?.trim() || 'Login failed'
    throw new Error(`Falha no login E2E: ${message}. Verifique PLAYWRIGHT_AUTH_EMAIL/PLAYWRIGHT_AUTH_PASSWORD sem alterar credenciais no teste.`)
  }

  if (outcome === 'timeout') {
    throw new Error('Falha no login E2E: a tela não avançou para /dashboard em 30s e nenhum erro conhecido ficou visível.')
  }

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 })
}

export async function waitForProtectedShell(page: Page) {
  attachApiProblemRecorder(page)

  await expect(
    page.getByRole('textbox', { name: /acesso rápido por funcionalidades/i }),
  ).toBeVisible({ timeout: 60_000 })

  const loadingState = page.getByRole('heading', { name: /carregando dados|loading data/i })
  if (await loadingState.isVisible().catch(() => false)) {
    await loadingState.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined)
  }
}

export async function isAccessDenied(page: Page) {
  return page
    .getByRole('heading', { name: /acesso negado|access denied/i })
    .isVisible()
    .catch(() => false)
}

export async function expectAccessDenied(page: Page) {
  await expect(page.getByRole('heading', { name: /acesso negado|access denied/i })).toBeVisible()
  await expect(page.getByText(/n[aÃ£]o possui permiss[aÃ£]o|does not have permission/i)).toBeVisible()
}

export async function loginWithUi(page: Page) {
  attachApiProblemRecorder(page)

  const { email, password, code, tenantId } = getAuthConfig()

  await page.addInitScript(() => {
    window.sessionStorage.removeItem('admin-v2-web:auth-pending')
    window.sessionStorage.removeItem('admin-v2-web:tenant')
  })

  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })

  await page.getByRole('button', { name: /continuar|continue/i }).waitFor({ state: 'visible', timeout: 30_000 })

  const emailInput = page.locator('form input').first()
  const passwordInput = page.locator('form input[type="password"]').first()
  await page.evaluate(() => {
    window.sessionStorage.removeItem('admin-v2-web:auth-pending')
    window.sessionStorage.removeItem('admin-v2-web:tenant')
  })
  await emailInput.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  await emailInput.pressSequentially(email)
  await passwordInput.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  await passwordInput.pressSequentially(password)
  await expect(emailInput).toHaveValue(email, { timeout: 5_000 })
  await expect(passwordInput).toHaveValue(password, { timeout: 5_000 })
  if ((await emailInput.inputValue()) !== email || (await passwordInput.inputValue()) !== password) {
    throw new Error('Falha no login E2E: os campos foram sobrescritos antes do submit.')
  }
  await page.getByRole('button', { name: /continuar|continue/i }).click()

  const codeInput = page.locator('input[maxlength="6"]')
  if (await codeInput.isVisible().catch(() => false)) {
    if (!code) {
      throw new Error('PLAYWRIGHT_AUTH_CODE não foi definido para um fluxo com autenticação em duas etapas.')
    }

    await codeInput.fill(code)
    await page.getByRole('button', { name: /validar código|validate code/i }).click()
  }

  await waitForDashboardOrLoginError(page)
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

export async function ensureDefaultTenantByUi(page: Page) {
  const tenantId = process.env.PLAYWRIGHT_AUTH_TENANT_ID || ''
  if (!tenantId) {
    return
  }

  await ensureTenantByUi(page, tenantId)
}

export async function ensureAgileTenantByUi(page: Page) {
  const tenantSearchText = process.env.PLAYWRIGHT_AGILE_TENANT_SEARCH || process.env.PLAYWRIGHT_AGILE_TENANT_ID || 'Agile'
  const tenantButton = page.getByRole('button', { name: / - / }).first()
  await expect(tenantButton).toBeVisible({ timeout: 30_000 })

  if ((await tenantButton.textContent())?.toLowerCase().includes(tenantSearchText.toLowerCase())) {
    return
  }

  const tenantSearch = await openTenantPanel(page)
  await tenantSearch.fill(tenantSearchText)

  const escapedSearch = tenantSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tenantOption = page.getByRole('button', { name: new RegExp(escapedSearch, 'i') }).filter({ hasText: / - / }).first()
  await expect(tenantOption).toBeVisible({ timeout: 30_000 })
  const selectedLabel = ((await tenantOption.textContent()) || '').trim()
  await tenantOption.click()

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 60_000 })
  await waitForProtectedShell(page)
  await expect(tenantButton).toContainText(selectedLabel.split(/\s+-\s+/)[0], { timeout: 30_000 })
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
