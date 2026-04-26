import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('API de Integracao > Aplicativos', () => {
  test('lista aplicativos, cria registro e abre rota de permissoes', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null
    let postedPermissions: unknown = null

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await page.route(/\/api\/integracao-aplicativos\/77\/permissoes$/, async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usuario: {
              id: '77',
              nome: 'App Financeiro',
              email: 'app.financeiro@empresa.com.br',
            },
            rows: [
              {
                tabelaNome: 'administradores',
                verboGet: true,
                verboPost: false,
                verboPut: false,
                verboDelete: false,
              },
              {
                tabelaNome: 'clientes',
                verboGet: true,
                verboPost: true,
                verboPut: false,
                verboDelete: false,
              },
            ],
          }),
        })
        return
      }

      postedPermissions = request.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.route(/\/api\/integracao-aplicativos\/77(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '77',
          ativo: true,
          codigo: 'APP-FIN',
          nome: 'App Financeiro',
          email: 'app.financeiro@empresa.com.br',
        }),
      })
    })

    await page.route(/\/api\/integracao-aplicativos(?:\?.*)?$/, async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '77',
                codigo: 'APP-FIN',
                nome: 'App Financeiro',
                email: 'app.financeiro@empresa.com.br',
                ativo: true,
                login: 'client-77',
                senha: 'secret-77',
              },
            ],
            meta: {
              page: 1,
              pages: 1,
              perPage: 15,
              from: 1,
              to: 1,
              total: 1,
            },
          }),
        })
        return
      }

      postedBody = request.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '77' }]),
      })
    })

    await page.goto('/api-de-integracao/aplicativos', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    await expect(page.getByRole('main')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('table').getByText('App Financeiro', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: /novo|new/i }).click()
    await expect(page).toHaveURL(/\/api-de-integracao\/aplicativos\/novo(?:\?|$)/, { timeout: 60_000 })

    const form = page.locator('form')
    await expect(form).toBeVisible()
    const inputs = form.locator('input')

    await inputs.nth(0).fill('APP-FIN')
    await inputs.nth(1).fill('App Financeiro')
    await inputs.nth(2).fill('app.financeiro@empresa.com.br')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()
    await expect(page).toHaveURL(/\/api-de-integracao\/aplicativos\/77\/editar(?:\?|$)/, { timeout: 60_000 })

    const payload = postedBody as {
      codigo?: string | null
      nome?: string | null
      email?: string | null
      ativo?: boolean
    }

    expect(payload.codigo).toBe('APP-FIN')
    expect(payload.nome).toBe('App Financeiro')
    expect(payload.email).toBe('app.financeiro@empresa.com.br')
    expect(payload.ativo).toBe(true)

    await page.goto('/api-de-integracao/aplicativos/77/permissoes', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    await expect(page.getByRole('heading', { name: /permiss|access permissions/i })).toBeVisible()
    await page.locator('tbody tr').first().locator('input[type="checkbox"]').nth(1).click()
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedPermissions).not.toBeNull()
    const permissionsPayload = postedPermissions as { rows?: Array<{ tabelaNome?: string }> }
    expect(permissionsPayload.rows?.length).toBeGreaterThan(0)
    expect(permissionsPayload.rows?.[0]?.tabelaNome).toBe('administradores')
  })
})
