import { expect, test } from '@playwright/test'
import { waitForProtectedShell } from '@/e2e/helpers/auth'

test.describe('Dicionário de Dados', () => {
  test('abre a tela, carrega tabela e exibe campos do componente', async ({ page }) => {
    await page.route('**/api/dicionario-dados/tabelas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              nome: 'usuarios',
              campos: [
                { id: '101', nome: 'id' },
                { id: '102', nome: 'nome' },
              ],
              componentes: [{ id: '201' }],
            },
          ],
        }),
      })
    })

    await page.route('**/api/dicionario-dados/tabelas/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              nome: 'usuarios',
              descricao: '<p>Tabela de usuários</p>',
              regra: '<p>Sem regra específica</p>',
              componentes: [
                {
                  componente: {
                    id: '10',
                    nome: 'Cadastro de usuários',
                    arquivo: 'usuarios-form.php',
                    ativo: true,
                  },
                },
              ],
            },
          ],
        }),
      })
    })

    await page.route('**/api/dicionario-dados/componentes/10/campos?idTabela=1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          componente: {
            id: '10',
            nome: 'Cadastro de usuários',
            arquivo: 'usuarios-form.php',
            ativo: true,
          },
          tabela: { id: '1', nome: 'usuarios' },
          fields: [
            {
              id: '101',
              nome: 'id',
              posicao: 1,
              status: 'encontrado',
              descricao: '',
              regra: '',
              ignoredRecordId: '',
              ignoredObservation: '',
            },
            {
              id: '103',
              nome: 'email',
              posicao: 3,
              status: 'nao_disponivel',
              descricao: '',
              regra: '',
              ignoredRecordId: '',
              ignoredObservation: '',
            },
          ],
        }),
      })
    })

    await page.goto('/ferramentas/dicionario-de-dados', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)

    await expect(page.getByRole('main').getByText(/Dicionário de dados/i).first()).toBeVisible()
    await expect(page.getByText(/Tabela: usuarios/i)).toBeVisible()

    await page.getByRole('button', { name: /Detalhes/i }).first().click()

    await expect(page.getByText(/Campos do componente usuarios-form\.php/i)).toBeVisible()
    await expect(page.getByRole('cell', { name: 'id' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'email' })).toBeVisible()
    await expect(page.getByText(/Não disponível/i).first()).toBeVisible()
  })
})
