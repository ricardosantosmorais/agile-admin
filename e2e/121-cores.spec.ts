import { test } from '@playwright/test'
import { catalogParents, createFilterAndDeleteLinearRecord, formRoot } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes colors through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^cores|colors$/i,
    path: '/cores',
    codePrefix: 'COR',
    namePrefix: 'Cor E2E',
    fillExtra: async (page) => {
      await formRoot(page).locator('input[type="color"]').first().fill('#116149')
    },
  })
})
