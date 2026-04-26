import { test } from '@playwright/test'
import { contentParents, createFilterAndDeleteLinearRecord } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes page areas through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: contentParents,
    linkName: /reas de p|page areas/i,
    path: '/areas-paginas',
    codePrefix: 'ARP',
    namePrefix: 'Area Pagina E2E',
  })
})
