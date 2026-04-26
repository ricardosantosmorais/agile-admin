import { expect, test } from '@playwright/test'
import { createApiRecord, deleteApiRecords } from '@/e2e/helpers/api'
import { waitForProtectedShell } from '@/e2e/helpers/auth'
import {
  deleteFirstFilteredRow,
  fieldInput,
  filterByCode,
  openFirstFilteredRowForEdit,
  pickFirstLookupOption,
} from '@/e2e/helpers/crud'

test.setTimeout(90_000)

test('lists, creates, filters and deletes coverage areas through the UI', async ({ page }) => {
  const suffix = Date.now()
  const routeCode = `ROT-${suffix}`
  const routeName = `Rota Base ${suffix}`
  const marketAreaCode = `PRA-${suffix}`
  const marketAreaName = `Praca Base ${suffix}`
  const code = `AREA-${suffix}`
  const name = `Area E2E ${suffix}`
  let routeId: string | null = null
  let marketAreaId: string | null = null

  try {
    routeId = await createApiRecord(page, '/api/rotas', {
      codigo: routeCode,
      nome: routeName,
      horario_corte: '18:00',
      ativo: true,
    })

    marketAreaId = await createApiRecord(page, '/api/pracas', {
      id_rota: routeId,
      codigo: marketAreaCode,
      nome: marketAreaName,
      cep_inicial: '60000000',
      cep_final: '60199999',
      ativo: true,
    })

    await page.goto('/areas-de-atuacao', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await waitForProtectedShell(page)
    await expect(page.getByRole('button', { name: /atualizar|refresh/i })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('link', { name: /novo|new/i }).click()
    await fieldInput(page, /^c.digo|code$/i).fill(code)
    await fieldInput(page, /^nome$/i).fill(name)
    await pickFirstLookupOption(page, /^pra.a|market area$/i, marketAreaName)
    await fieldInput(page, /^cep inicial|zip start$/i).fill('60000-000')
    await fieldInput(page, /^cep final|zip end$/i).fill('60199-999')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()
    await expect(page).toHaveURL(/\/areas-de-atuacao(?:\?|$)/, { timeout: 30_000 })

    await filterByCode(page, code)
    await openFirstFilteredRowForEdit(page, /\/areas-de-atuacao\/[^/]+\/editar$/)
    await fieldInput(page, /^nome$/i).fill(`${name} Editado`)
    await page.getByRole('button', { name: /salvar|save/i }).first().click()
    await expect(page).toHaveURL(/\/areas-de-atuacao(?:\?|$)/, { timeout: 30_000 })

    await filterByCode(page, code)
    await deleteFirstFilteredRow(page)
  } finally {
    await deleteApiRecords(page, '/api/pracas', [marketAreaId])
    await deleteApiRecords(page, '/api/rotas', [routeId])
  }
})
