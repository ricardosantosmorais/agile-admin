import { test } from '@playwright/test'
import { catalogParents, createFilterAndDeleteLinearRecord } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes lines through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^linhas|lines$/i,
    path: '/linhas',
    codePrefix: 'LIN',
    namePrefix: 'Linha E2E',
  })
})
