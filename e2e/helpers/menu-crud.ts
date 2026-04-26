import { expect, type Page } from '@playwright/test'
import {
  deleteFirstFilteredRow,
  ensureFiltersVisible,
  fieldInput,
  filterByCode,
  formRoot,
  openCrudModule,
  selectAt,
} from '@/e2e/helpers/crud'

export const catalogParents = [/cat.logo|catalog/i]
export const contentParents = [/conte.do|content/i]
export const marketingParents = [/marketing/i]
export const codeLabel = /^c(?:o|\u00f3|Ã³)digo$/i
export const titleLabel = /^t(?:i|\u00ed|Ã­tulo|Ã­)tulo$|^title$/i

export type LinearCrudModule = {
  parents: RegExp[]
  linkName: RegExp
  path: string
  codePrefix: string
  namePrefix: string
  filterBy?: 'code' | 'name'
  fillDefaultName?: boolean
  fillExtra?: (page: Page, suffix: number) => Promise<void>
}

export async function filterByName(page: Page, name: string) {
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^nome$|^name$/i }).fill(name)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(name, { timeout: 30_000 })
}

export async function filterByTitle(page: Page, title: string) {
  await ensureFiltersVisible(page)
  await page.getByRole('textbox', { name: /^t.tulo$|^title$/i }).fill(title)
  await page.getByRole('button', { name: /aplicar filtros|apply filters/i }).click()
  await expect(page.locator('tbody tr').first()).toContainText(title, { timeout: 30_000 })
}

export async function createFilterAndDeleteLinearRecord(page: Page, module: LinearCrudModule) {
  const suffix = Date.now()
  const code = `${module.codePrefix}-${suffix}`
  const name = `${module.namePrefix} ${suffix}`

  await openCrudModule(page, {
    parents: module.parents,
    linkName: module.linkName,
    urlPattern: new RegExp(`${module.path.replace(/\//g, '\\/')}(?:\\?|$)`),
    path: module.path,
  })

  await page.getByRole('link', { name: /^novo$|^new$/i }).click()
  await fieldInput(page, codeLabel).fill(code)
  if (module.fillDefaultName !== false) {
    await fieldInput(page, /^nome$/i).fill(name)
  }
  await module.fillExtra?.(page, suffix)

  const saveResponse = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST'
      && new URL(response.url()).pathname === `/api${module.path}`
      && response.status() < 400
  }, { timeout: 30_000 })

  await page.getByRole('button', { name: /salvar|save/i }).first().click()
  await saveResponse
  await page.goto(module.path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await expect(page).toHaveURL(new RegExp(`${module.path.replace(/\//g, '\\/')}(?:\\?|$)`), { timeout: 30_000 })

  if (module.filterBy === 'name') {
    await filterByName(page, name)
  } else {
    await filterByCode(page, code)
  }
  await deleteFirstFilteredRow(page)
}

export { formRoot, selectAt }
