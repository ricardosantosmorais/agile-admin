import { expect, type Page } from '@playwright/test'

export type DashboardApiTiming = {
  url: string
  method: string
  status: number
  durationMs: number
  blocks: string[]
}

export function attachDashboardApiTiming(page: Page, urlPart: string) {
  const starts = new Map<unknown, { startedAt: number; blocks: string[] }>()
  const timings: DashboardApiTiming[] = []

  page.on('request', (request) => {
    if (!request.url().includes(urlPart) || request.method() !== 'POST') {
      return
    }

    let blocks: string[] = []
    try {
      const payload = JSON.parse(request.postData() ?? '{}') as { blocks?: string[] }
      blocks = payload.blocks ?? []
    } catch {
      blocks = []
    }

    starts.set(request, { startedAt: Date.now(), blocks })
  })

  page.on('response', (response) => {
    const request = response.request()
    const start = starts.get(request)
    if (!start) {
      return
    }

    starts.delete(request)
    timings.push({
      url: response.url(),
      method: request.method(),
      status: response.status(),
      durationMs: Date.now() - start.startedAt,
      blocks: start.blocks,
    })
  })

  return timings
}

export async function scrollDashboardToBottom(page: Page) {
  let previousHeight = 0

  for (let step = 0; step < 20; step += 1) {
    const currentHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(350)

    if (currentHeight === previousHeight) {
      break
    }

    previousHeight = currentHeight
  }
}

export async function scrollDashboardSections(page: Page, headings: RegExp[]) {
  for (const heading of headings) {
    const sectionHeading = page.getByRole('heading', { name: heading }).last()
    await sectionHeading.scrollIntoViewIfNeeded({ timeout: 30_000 })
    await expect(sectionHeading).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(250)
  }
}

export async function expectDashboardBlocksLoaded(
  timings: DashboardApiTiming[],
  expectedBlocks: string[],
  {
    timeout = 90_000,
    maxApiDurationMs = 20_000,
  }: {
    timeout?: number
    maxApiDurationMs?: number
  } = {},
) {
  await expect.poll(() => {
    const loaded = new Set(timings.flatMap((timing) => timing.blocks))
    return expectedBlocks.every((block) => loaded.has(block))
  }, {
    timeout,
    message: `Expected dashboard blocks to load: ${expectedBlocks.join(', ')}`,
  }).toBeTruthy()

  const loaded = new Set(timings.flatMap((timing) => timing.blocks))
  const missingBlocks = expectedBlocks.filter((block) => !loaded.has(block))
  expect(
    missingBlocks,
    `Missing dashboard blocks: ${missingBlocks.join(', ')}. Loaded: ${Array.from(loaded).join(', ')}`,
  ).toEqual([])

  const failedResponses = timings.filter((timing) => timing.status >= 400)
  expect(failedResponses, `Dashboard API failures: ${JSON.stringify(failedResponses)}`).toEqual([])

  const slowResponses = timings.filter((timing) => timing.durationMs > maxApiDurationMs)
  expect(slowResponses, `Slow dashboard API responses: ${JSON.stringify(slowResponses)}`).toEqual([])
}
