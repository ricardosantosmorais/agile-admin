import { expect, test } from '@playwright/test'

test.describe('Configurações > Clientes', () => {
  test('abre o formulário direto, carrega parâmetros e salva alterações', async ({ page }) => {
    let postedBody: unknown = null

    await page.route('**/api/configuracoes/clientes', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                chave: 'forma_ativacao_cliente',
                parametros: 'codigo',
                created_at: '2026-04-02 09:00:00',
                usuario: { nome: 'Administrador' },
              },
              {
                chave: 'senha_forte',
                parametros: '0',
                created_at: '2026-04-02 09:01:00',
                usuario: { nome: 'Administrador' },
              },
              {
                chave: 'campos_ocultos_cadastro_cliente',
                parametros: 'telefone,sexo',
                created_at: '2026-04-02 09:02:00',
                usuario: { nome: 'Administrador' },
              },
            ],
          }),
        })
        return
      }

      postedBody = request.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/configuracoes/clientes', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60_000 })

    await expect(page.locator('form')).toBeVisible()
    const saveButton = page.getByRole('button', { name: /salvar|save/i }).first()
    await expect(saveButton).toBeVisible()
    await expect(saveButton).toBeDisabled()

    await page.locator('form').locator('input').first().fill('telefone,sexo,cnpj')
    await page.locator('form').locator('select').first().selectOption('email')
    await expect(saveButton).toBeEnabled()

    await saveButton.click()

    await expect.poll(() => postedBody).not.toBeNull()

    const parsed = postedBody as { parameters?: Array<{ chave?: string; parametros?: string }> }
    expect(parsed.parameters?.[0]?.chave).toBe('versao')
    expect(parsed.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ chave: 'campos_ocultos_cadastro_cliente', parametros: 'telefone,sexo,cnpj' }),
        expect.objectContaining({ chave: 'forma_ativacao_cliente', parametros: 'email' }),
      ]),
    )
  })
})
