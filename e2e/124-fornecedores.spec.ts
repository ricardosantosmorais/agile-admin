import { test } from '@playwright/test'
import { fieldInput } from '@/e2e/helpers/crud'
import { catalogParents, createFilterAndDeleteLinearRecord, selectAt } from '@/e2e/helpers/menu-crud'

test.setTimeout(240_000)

test('lists, creates, filters and deletes suppliers through the UI', async ({ page }) => {
  await createFilterAndDeleteLinearRecord(page, {
    parents: catalogParents,
    linkName: /^fornecedores|suppliers$/i,
    path: '/fornecedores',
    codePrefix: 'FOR',
    namePrefix: 'Fornecedor E2E',
    fillDefaultName: false,
    fillExtra: async (page, suffix) => {
      await selectAt(page, 0).selectOption('PJ')
      await fieldInput(page, /^nome fantasia|trade name$/i).fill(`Fornecedor E2E ${suffix}`)
      await fieldInput(page, /^raz.o social|company name$/i).fill(`Fornecedor E2E ${suffix} Ltda`)
      await fieldInput(page, /^e-mail$/i).fill(`fornecedor.${suffix}@example.com`)
    },
  })
})
