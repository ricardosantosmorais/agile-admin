import { test } from '@playwright/test'
import { catalogParents, createFilterAndDeleteLinearRecord } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes brands through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^marcas|brands$/i,
    path: '/marcas',
    codePrefix: 'MAR',
    namePrefix: 'Marca E2E',
  })
})
