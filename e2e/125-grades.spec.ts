import { test } from '@playwright/test'
import { fieldInput } from '@/e2e/helpers/crud'
import { catalogParents, createFilterAndDeleteLinearRecord, selectAt } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes grids through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^grades|grids$/i,
    path: '/grades',
    codePrefix: 'GRA',
    namePrefix: 'Grade E2E',
    fillExtra: async (page, suffix) => {
      await fieldInput(page, /^id classe|class id$/i).fill(`CLS-${suffix}`)
      await selectAt(page, 0).selectOption('tipo1')
      await fieldInput(page, /^op..o 1|option 1$/i).fill(`Opcao ${suffix}`)
    },
  })
})
