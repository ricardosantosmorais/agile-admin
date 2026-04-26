import fs from 'node:fs'
import path from 'node:path'
import type { Page, Response } from '@playwright/test'

const attachedPages = new WeakSet<Page>()

function redact(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/("senha"\s*:\s*)"[^"]+"/gi, '$1"[redacted]"')
    .replace(/("password"\s*:\s*)"[^"]+"/gi, '$1"[redacted]"')
    .replace(/("token"\s*:\s*)"[^"]+"/gi, '$1"[redacted]"')
}

function shouldRecord(response: Response) {
  const status = response.status()
  return status >= 400 && response.url().includes('/api/')
}

async function recordApiProblem(response: Response) {
  if (!shouldRecord(response)) {
    return
  }

  const request = response.request()
  const url = new URL(response.url())
  let responseBody = ''

  try {
    responseBody = redact((await response.text()).slice(0, 1000))
  } catch {
    responseBody = '[body unavailable]'
  }

  const entry = {
    timestamp: new Date().toISOString(),
    method: request.method(),
    status: response.status(),
    url: `${url.pathname}${url.search}`,
    pageUrl: response.frame()?.page()?.url() || '',
    responseBody,
  }

  const outputPath = path.join(process.cwd(), 'test-results', 'api-problems.jsonl')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.appendFileSync(outputPath, `${JSON.stringify(entry)}\n`, 'utf8')
}

export function attachApiProblemRecorder(page: Page) {
  if (attachedPages.has(page)) {
    return
  }

  attachedPages.add(page)
  page.on('response', (response) => {
    recordApiProblem(response).catch(() => undefined)
  })
}
