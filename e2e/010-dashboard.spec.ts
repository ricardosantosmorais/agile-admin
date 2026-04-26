import { expect, test } from '@playwright/test'
import { ensureDefaultTenantByUi, waitForProtectedShell } from '@/e2e/helpers/auth'
import { attachDashboardApiTiming, expectDashboardBlocksLoaded, scrollDashboardSections } from '@/e2e/helpers/dashboard-performance'

test.setTimeout(180_000)

test('loads all company dashboard lazy blocks while scrolling within the API budget', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index)
        if (key?.startsWith('dashboard-v2:')) {
          window.localStorage.removeItem(key)
        }
      }
    } catch {
      // noop
    }
  })

  const timings = attachDashboardApiTiming(page, '/api/dashboard')

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForProtectedShell(page)
  await ensureDefaultTenantByUi(page)

  await expect(page.getByRole('button', { name: /atualizar dados|refresh data/i })).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => timings.some((timing) => timing.blocks.includes('resumo'))).toBeTruthy()

  await page.waitForTimeout(1_000)
  expect(timings.some((timing) => timing.blocks.includes('marketing_tops'))).toBeFalsy()

  await scrollDashboardSections(page, [
    /indicadores de clientes|customer indicators/i,
    /faturamento por dia|daily revenue/i,
    /funil de convers|conversion funnel/i,
    /vendas por dispositivo|device sales/i,
    /top clientes do per.odo|top clients/i,
    /receita por hora|revenue per hour/i,
    /formas de pagamento|payment methods/i,
    /mix de incentivos|incentives mix/i,
    /top cupons por receita|top coupons by revenue/i,
  ])
  await expect(page.getByRole('heading', { name: /top cupons por receita|top coupons by revenue/i })).toBeVisible({ timeout: 30_000 })

  await expectDashboardBlocksLoaded(timings, [
    'resumo',
    'clientes_resumo',
    'serie',
    'alertas',
    'funil',
    'operacao',
    'mix',
    'clientes_listas',
    'coorte',
    'produtos',
    'pagamentos',
    'marketing_resumo',
    'marketing_mix',
    'marketing_tops',
  ])
})
