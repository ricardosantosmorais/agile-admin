import { expect, test } from '@playwright/test'
import { ensureAgileTenantByUi, waitForProtectedShell } from '@/e2e/helpers/auth'
import { attachDashboardApiTiming, expectDashboardBlocksLoaded, scrollDashboardSections } from '@/e2e/helpers/dashboard-performance'

test.setTimeout(180_000)

test('loads the Agile dashboard menu shell and lazy blocks while scrolling @agile', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem('dashboard_agileecommerce')
  })

  const timings = attachDashboardApiTiming(page, '/api/dashboard-agileecommerce')

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await ensureAgileTenantByUi(page)

  const sidebar = page.getByRole('complementary')
  await expect(sidebar.getByRole('link', { name: /^in.cio|home$/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /^empresas|companies$/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /^implanta..es|implementations$/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /assistente de vendas ia|sales assistant/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /atualiza..es gerais|general updates/i })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^infraestrutura|infrastructure$/i })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /integra..o com erp|erp integration/i })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^cadastros|records$/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /^notifica..es|notifications$/i })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^ferramentas|tools$/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /^administradores|administrators$/i })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /^ips bloqueados|blocked ips$/i })).toBeVisible()

  await expect(page.getByText(/dashboard agileecommerce/i)).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 60_000 })
  await expect.poll(() => timings.some((timing) => timing.blocks.includes('analytics_headline')), { timeout: 60_000 }).toBeTruthy()

  await scrollDashboardSections(page, [
    /pulso comercial da carteira/i,
    /vis.o executiva comercial|commercial executive view/i,
    /opera..o anal.tica|analytics operation/i,
    /sa.de da plataforma|platform health/i,
    /opera..o de produto|product operation/i,
    /engajamento e comunica..o|engagement and communication/i,
    /opera..o interna|internal operation/i,
    /tools e observabilidade|tools and observability/i,
  ])
  await expect(page.getByRole('heading', { name: /tools e observabilidade|tools and observability/i })).toBeVisible({ timeout: 60_000 })

  await expectDashboardBlocksLoaded(timings, [
    'analytics_headline',
    'analytics_trust',
    'analytics_pulse',
    'analytics_commercial',
    'analytics_operations',
    'empresas',
    'apps_headline',
    'apps_detail',
    'push_headline',
    'push_detail',
    'processos_headline',
    'processos_detail',
    'agent',
    'audit',
  ])
})
