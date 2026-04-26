import { expect, test } from '@playwright/test'
import { createApiRecord, deleteApiRecords } from '@/e2e/helpers/api'
import { deleteFirstFilteredRow, fieldInput, formRoot, openCrudModule, selectAt } from '@/e2e/helpers/crud'
import { codeLabel, contentParents, filterByTitle, titleLabel } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes pages through the UI', async ({ page }) => {
  const suffix = Date.now()
  const areaCode = `ARP-PAG-${suffix}`
  const areaName = `Area Pagina E2E ${suffix}`
  const pageCode = `PAG-${suffix}`
  const title = `Pagina E2E ${suffix}`
  let areaId: string | null = null

  try {
    areaId = await createApiRecord(page, '/api/areas-paginas', {
      ativo: true,
      codigo: areaCode,
      nome: areaName,
    })

    await openCrudModule(page, {
      parents: contentParents,
      linkName: /^p.ginas|pages$/i,
      urlPattern: /\/paginas(?:\?|$)/,
      path: '/paginas',
    })

    await page.getByRole('link', { name: /^novo$|^new$/i }).click()
    await fieldInput(page, codeLabel).fill(pageCode)
    await selectAt(page, 0).selectOption(areaId)
    await fieldInput(page, titleLabel).fill(title)
    await formRoot(page).locator('input[type="number"]').first().fill('1')
    await selectAt(page, 1).selectOption('todos')
    await page.getByRole('button', { name: /salvar|save/i }).first().click()
    await expect(page).toHaveURL(/\/paginas(?:\/[^/]+\/editar|\?|$)/, { timeout: 30_000 })

    await page.goto('/paginas', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await filterByTitle(page, title)
    await deleteFirstFilteredRow(page)
  } finally {
    await deleteApiRecords(page, '/api/areas-paginas', [areaId])
  }
})
