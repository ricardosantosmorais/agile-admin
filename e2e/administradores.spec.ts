import { expect, test } from '@playwright/test'
import { loginWithUi } from '@/e2e/helpers/auth'

test.describe('Administradores', () => {
  test('lista administradores, cria um novo registro e abre a edição', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await loginWithUi(page)

    await page.route(/\/api\/administradores\/perfis$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: '10', nome: 'Master' },
            { id: '20', nome: 'Comercial' },
          ],
        }),
      })
    })

    await page.route(/\/api\/administradores\/55(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '55',
          ativo: true,
          codigo: 'ADM55',
          id_perfil: '20',
          nome: 'Maria Gestora',
          email: 'maria@empresa.com.br',
          ddd_celular: '27',
          celular: '999999999',
          perfil: { id: '20', nome: 'Comercial' },
        }),
      })
    })

    await page.route(/\/api\/administradores(?:\?.*)?$/, async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '1',
                nome: 'Administrador Master',
                email: 'master@empresa.com.br',
                ativo: true,
                perfil: { nome: 'Master' },
                ultimo_acesso: '2026-04-06T10:00:00.000Z',
                ip_ultimo_acesso: '127.0.0.1',
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

    await page.goto('/administradores', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('table').getByText('Administrador Master', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: /novo|new/i }).click()
    await expect(page).toHaveURL(/\/administradores\/novo(?:\?|$)/, { timeout: 60_000 })
    const form = page.locator('form')
    await expect(form).toBeVisible()

    const inputs = form.locator('input')
    await inputs.nth(0).fill('ADM55')
    await form.getByRole('combobox').selectOption({ label: 'Comercial' })
    await expect(form.getByRole('combobox')).toHaveValue('20')
    await inputs.nth(1).fill('Maria Gestora')
    await inputs.nth(2).fill('maria@empresa.com.br')
    await inputs.nth(3).fill('(27) 99999-9999')
    await inputs.nth(4).fill('Senha@123')
    await inputs.nth(5).fill('Senha@123')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()
    await expect(page).toHaveURL(/\/administradores\/55\/editar(?:\?|$)/, { timeout: 60_000 })

    const payload = postedBody as {
      codigo?: string | null
      id_perfil?: string | null
      nome?: string | null
      email?: string | null
      ddd_celular?: string | null
      celular?: string | null
      senha?: string | null
    }

    expect(payload.codigo).toBe('ADM55')
    expect(payload.id_perfil).toBe('20')
    expect(payload.nome).toBe('Maria Gestora')
    expect(payload.email).toBe('maria@empresa.com.br')
    expect(payload.ddd_celular).toBe('27')
    expect(payload.celular).toBe('999999999')
    expect(payload.senha).toBe('Senha@123')

    const editForm = page.locator('form')
    const editInputs = editForm.locator('input')
    await expect(editInputs.nth(0)).toHaveValue('ADM55')
    await expect(editInputs.nth(1)).toHaveValue('Maria Gestora')
    await expect(editInputs.nth(2)).toHaveValue('maria@empresa.com.br')
    await expect(editForm.getByRole('combobox')).toHaveValue('20')
  })
})
