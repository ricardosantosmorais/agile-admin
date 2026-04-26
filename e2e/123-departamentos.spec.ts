import { test } from '@playwright/test'
import { catalogParents, createFilterAndDeleteLinearRecord, formRoot } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes departments through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^departamentos|departments$/i,
    path: '/departamentos',
    codePrefix: 'DEP',
    namePrefix: 'Departamento E2E',
    filterBy: 'name',
    fillExtra: async (page) => {
      await formRoot(page).locator('input[type="number"]').first().fill('1')
    },
  })
})
