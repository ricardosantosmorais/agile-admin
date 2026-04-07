import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Perfis', () => {
  test('lista perfis e salva acessos hierárquicos no formulário', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await page.route(/\/api\/perfis\/acessos(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: [
            {
              id: 'administracao',
              label: 'Administração',
              children: [
                {
                  id: 'cadastros',
                  label: 'Cadastros',
                  children: [
                    { id: 'clientes', label: 'Clientes', children: [] },
                    { id: 'vendedores', label: 'Vendedores', children: [] },
                  ],
                },
              ],
            },
          ],
          selectedIds: [],
        }),
      })
    })

    await page.route(/\/api\/perfis(?:\?.*)?$/, async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '1',
                codigo: 'MASTER',
                nome: 'Master',
                ativo: true,
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
        body: JSON.stringify([{ id: '55' }]),
      })
    })

    await page.goto('/perfis', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('table').getByText('Master', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: /novo|new/i }).click()
    await expect(page).toHaveURL(/\/perfis\/novo(?:\?|$)/, { timeout: 60_000 })
    await expect(page.locator('form')).toBeVisible()

    await page.getByLabel(/código|code/i).fill('COMERCIAL')
    await page.getByLabel(/nome|name/i).fill('Comercial')
    await page.getByRole('checkbox', { name: /clientes/i }).check()
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()

    const payload = postedBody as {
      codigo?: string | null
      nome?: string | null
      id_funcionalidades?: string
    }

    expect(payload.codigo).toBe('COMERCIAL')
    expect(payload.nome).toBe('Comercial')
    expect(payload.id_funcionalidades).toContain('clientes')
    expect(payload.id_funcionalidades).toContain('cadastros')
    expect(payload.id_funcionalidades).toContain('administracao')
  })
})
