import { test } from '@playwright/test'
import { catalogParents, createFilterAndDeleteLinearRecord } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes collections through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^cole|collections$/i,
    path: '/colecoes',
    codePrefix: 'COL',
    namePrefix: 'Colecao E2E',
  })
})
