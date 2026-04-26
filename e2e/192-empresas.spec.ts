import { expect, test } from '@playwright/test'
import { fieldDateInput, fieldInput, fieldNumberInput, fieldSelect, pickLookupOption } from '@/e2e/helpers/crud'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Empresas', () => {
  test('lista empresas, cria um novo registro e abre a edição', async ({ page }) => {
    test.setTimeout(120_000)

    let postedBody: unknown = null

    await page.route(/\/api\/lookups\/clusters(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '13', label: 'Cluster Principal' }]),
      })
    })

    await page.route(/\/api\/lookups\/templates_integracao(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '9', label: 'Template Winthor' }]),
      })
    })

    await page.route(/\/api\/lookups\/administradores_master(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', label: 'Ana Gerente' },
          { id: '2', label: 'Bruno Analista' },
        ]),
      })
    })

    await page.route(/\/api\/empresas\/55(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '55',
          ativo: true,
          tipo: 'b2b',
          status: 'producao',
          codigo: 'EMP55',
          cnpj: '12345678000199',
          nome_fantasia: 'Empresa 55',
          razao_social: 'Empresa 55 LTDA',
          email: 'contato@empresa55.com.br',
          url: 'https://empresa55.exemplo.com.br',
          id_cluster: '13',
          id_template: '9',
        }),
      })
    })

    await page.route(/\/api\/empresas(?:\?.*)?$/, async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: '55',
              codigo: 'EMP55',
              cnpj: '12345678000199',
              nome_fantasia: 'Empresa 55',
              status: 'producao',
              manutencao: false,
              bloqueado: false,
              ativo: true,
            }],
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

    await page.goto('/empresas', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)
    await expect(page.getByRole('table').getByText('Empresa 55', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: /novo|new/i }).click()
    await expect(page).toHaveURL(/\/empresas\/novo(?:\?|$)/, { timeout: 60_000 })

    await fieldSelect(page, /^tipo$/i).selectOption('b2b')
    await fieldSelect(page, /^status$/i).selectOption('homologacao')
    await fieldInput(page, /^c[oó]digo$/i).fill('EMP55')
    await fieldInput(page, /^cnpj$/i).fill('12.345.678/0001-99')
    await fieldInput(page, /^nome fantasia$/i).fill('Empresa 55')
    await fieldInput(page, /^raz[aã]o social$/i).fill('Empresa 55 LTDA')

    await page.getByRole('button', { name: /endere[cç]o|address/i }).click()
    const addressInputs = page.locator('form').first().locator('input:visible')
    await addressInputs.nth(0).fill('29160-000')
    await addressInputs.nth(1).fill('Rua Central')
    await addressInputs.nth(2).fill('100')
    await addressInputs.nth(4).fill('Centro')
    await addressInputs.nth(5).fill('Serra')
    await fieldSelect(page, /^uf$/i).selectOption('ES')

    await page.getByRole('button', { name: /contatos|contacts/i }).click()
    const contactInputs = page.locator('form').first().locator('input:visible')
    await contactInputs.nth(0).fill('contato@empresa55.com.br')
    await contactInputs.nth(1).fill('(27) 3333-4444')
    await contactInputs.nth(2).fill('(27) 99999-9999')

    await page.getByRole('button', { name: /implanta[cç][aã]o|implementation/i }).click()
    await fieldInput(page, /^url$/i).fill('empresa55.exemplo.com.br')
    await pickLookupOption(page, /^cluster$/i, /Cluster Principal/i)
    await fieldInput(page, /^bucket s3$/i).fill('bucket-root')
    await fieldSelect(page, /^erp$/i).selectOption('sap')
    await pickLookupOption(page, /^template de integra[cç][aã]o$/i, /Template Winthor/i)
    await pickLookupOption(page, /^gerente de implanta[cç][aã]o$/i, /Ana Gerente/i)
    await pickLookupOption(page, /^analista de implanta[cç][aã]o$/i, /Bruno Analista/i)
    await fieldDateInput(page, /^data in[ií]cio$/i).fill('2026-04-10')
    await fieldNumberInput(page, /^dias previstos$/i).fill('45')
    await fieldDateInput(page, /^data conclus[aã]o$/i).fill('2026-04-20')

    await page.getByRole('button', { name: /salvar|save/i }).first().click()

    await expect.poll(() => postedBody).not.toBeNull()
    await expect(page).toHaveURL(/\/empresas\/55\/editar(?:\?|$)/, { timeout: 60_000 })

    const payload = postedBody as Record<string, unknown>
    expect(payload.codigo).toBe('EMP55')
    expect(payload.cnpj).toBe('12345678000199')
    expect(payload.cep).toBe('29160000')
    expect(payload.ddd).toBe('27')
    expect(payload.telefone).toBe('33334444')
    expect(payload.ddd_celular).toBe('27')
    expect(payload.celular).toBe('999999999')
    expect(payload.url).toBe('https://empresa55.exemplo.com.br')
    expect(payload.s3_bucket).toBe('https://bucket-root.agilecdn.com.br')
    expect(payload.id_cluster).toBe('13')
    expect(payload.id_template).toBe('9')
    expect(payload.id_implantacao_gerente).toBe('1')
    expect(payload.id_implantacao_analista).toBe('2')
    expect(payload.data_inicio_implantacao).toBe('2026-04-10 00:00:00')
    expect(payload.data_fim_implantacao).toBe('2026-04-20 00:00:00')

    await expect(fieldInput(page, /^c[oó]digo$/i)).toHaveValue('EMP55')
    await expect(fieldInput(page, /^nome fantasia$/i)).toHaveValue('Empresa 55')
    await page.getByRole('button', { name: /contatos|contacts/i }).click()
    await expect(page.locator('form').first().locator('input:visible').nth(0)).toHaveValue('contato@empresa55.com.br')
  })
})
