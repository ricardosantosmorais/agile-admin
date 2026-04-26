import { expect, type Page } from '@playwright/test'

export async function createApiRecord(page: Page, path: string, body: Record<string, unknown>) {
  const response = await page.request.post(path, { data: body })
  await expect(response, `POST ${path}`).toBeOK()
  const payload = await response.json()

  if (Array.isArray(payload) && payload[0]?.id) {
    return String(payload[0].id)
  }

  if (payload?.id) {
    return String(payload.id)
  }

  throw new Error(`POST ${path} did not return an id`)
}

export async function deleteApiRecords(page: Page, path: string, ids: Array<string | null | undefined>) {
  const validIds = ids.filter((id): id is string => Boolean(id))
  if (!validIds.length) {
    return
  }

  const response = await page.request.delete(path, { data: { ids: validIds } })
  await expect(response, `DELETE ${path}`).toBeOK()
}
