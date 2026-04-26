import { test } from '@playwright/test'
import { createFilterAndDeleteLinearRecord, marketingParents } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes banner areas through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: marketingParents,
    linkName: /^.reas de banner|banner areas$/i,
    path: '/areas-banner',
    codePrefix: 'ARB',
    namePrefix: 'Area Banner E2E',
  })
})
