import { expect, test, type APIRequestContext } from '@playwright/test'
import { openPriceStockModule, pickLookupOption, selectAt } from '@/e2e/helpers/crud'

test.setTimeout(180_000)

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function loadLookupOptions(request: APIRequestContext, resource: string) {
  const response = await request.get(`/api/lookups/${resource}?page=1&perPage=20&q=`)
  expect(response.ok()).toBeTruthy()
  return await response.json() as Array<{ value: string; label: string }>
}

test('creates, edits and deletes product branches through the UI', async ({ page, request }) => {
  const products = await loadLookupOptions(request, 'produtos')
  const branches = await loadLookupOptions(request, 'filiais')
  const priceTables = await loadLookupOptions(request, 'tabelas_preco')
  const channels = await loadLookupOptions(request, 'canais_distribuicao')

  const existingResponse = await request.get('/api/produtos-x-filiais?page=1&perPage=1000')
  expect(existingResponse.ok()).toBeTruthy()
  const existingPayload = await existingResponse.json() as {
    data?: Array<{
      id_produto?: string | number | null
      id_filial?: string | number | null
      id_tabela_preco?: string | number | null
      id_canal_distribuicao_cliente?: string | number | null
    }>
  }
  const existingKeys = new Set(
    (existingPayload.data ?? []).map((record) => [
      String(record.id_produto ?? '').trim(),
      String(record.id_filial ?? '').trim(),
      String(record.id_tabela_preco ?? '').trim(),
      String(record.id_canal_distribuicao_cliente ?? '').trim(),
    ].join('|')),
  )

  let candidate: {
    product: { value: string; label: string }
    branch: { value: string; label: string }
    priceTable: { value: string; label: string }
    channel: { value: string; label: string }
  } | null = null

  for (const product of products.slice(0, 8)) {
    for (const branch of branches.slice(0, 8)) {
      for (const priceTable of priceTables.slice(0, 8)) {
        for (const channel of channels.slice(0, 8)) {
          const key = [product.value, branch.value, priceTable.value, channel.value].join('|')
          if (!existingKeys.has(key)) {
            candidate = { product, branch, priceTable, channel }
            break
          }
        }

        if (candidate) {
          break
        }
      }

      if (candidate) {
        break
      }
    }

    if (candidate) {
      break
    }
  }

  test.skip(!candidate, 'Nenhuma combinação livre encontrada para o teste de produtos x filiais neste ambiente.')

  await openPriceStockModule(page, {
    linkName: /produtos x filiais|products x branches/i,
    urlPattern: /\/produtos-x-filiais(?:\?|$)/,
    path: '/produtos-x-filiais',
  })

  await page.getByRole('link', { name: /novo|new/i }).click()
  await selectAt(page, 0).selectOption('disponivel')
  await selectAt(page, 1).selectOption('normal')
  await pickLookupOption(page, /^produto|product$/i, new RegExp(escapeRegExp(candidate!.product.label), 'i'))
  await pickLookupOption(page, /^filial|branch$/i, new RegExp(escapeRegExp(candidate!.branch.label), 'i'))
  await pickLookupOption(page, /^tabela de preço|price table$/i, new RegExp(escapeRegExp(candidate!.priceTable.label), 'i'))
  await pickLookupOption(page, /^canal de distribuição|distribution channel$/i, new RegExp(escapeRegExp(candidate!.channel.label), 'i'))

  const saveResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/produtos-x-filiais') && response.request().method() === 'POST',
    { timeout: 15_000 },
  ).catch(() => null)

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  const saveResponse = await saveResponsePromise
  if (saveResponse && !saveResponse.ok()) {
    throw new Error(`Falha ao salvar produto x filial: ${await saveResponse.text()}`)
  }

  await expect(page).toHaveURL(/\/produtos-x-filiais(?:\?|$)/, { timeout: 30_000 })

  const createdRow = page.locator('tbody tr')
    .filter({ hasText: candidate!.product.label })
    .filter({ hasText: candidate!.branch.label })
    .filter({ hasText: candidate!.priceTable.label })
    .first()
  await expect(createdRow).toBeVisible({ timeout: 30_000 })
  await createdRow.locator('a[href*="/editar"]').first().click()
  await expect(page).toHaveURL(/\/produtos-x-filiais\/.+\/editar$/, { timeout: 30_000 })

  await selectAt(page, 0).selectOption('em_revisao')
  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await expect(page).toHaveURL(/\/produtos-x-filiais(?:\?|$)/, { timeout: 30_000 })

  const updatedRow = page.locator('tbody tr')
    .filter({ hasText: candidate!.product.label })
    .filter({ hasText: candidate!.branch.label })
    .filter({ hasText: candidate!.priceTable.label })
    .first()
  await expect(updatedRow).toContainText(/em revisão|in review/i, { timeout: 30_000 })
  await updatedRow.locator('button').last().click()
  await page.getByRole('button', { name: /excluir|delete/i }).click()
})
