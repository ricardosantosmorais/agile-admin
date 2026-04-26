import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

function loadLocalEnvFile(filename: string) {
  const filePath = path.join(process.cwd(), filename)
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex < 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadLocalEnvFile('.env.local')

const port = Number(process.env.PLAYWRIGHT_PORT || 3100)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`
const retries = Number(process.env.PLAYWRIGHT_RETRIES || 0)
const workers = Number(process.env.PLAYWRIGHT_WORKERS || 1)
const video = process.env.PLAYWRIGHT_VIDEO === '1' ? 'retain-on-failure' : 'off'
const actionTimeout = Number(process.env.PLAYWRIGHT_ACTION_TIMEOUT || 15_000)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers,
  retries,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : 'list',
  use: {
    actionTimeout,
    navigationTimeout: 60_000,
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      grepInvert: /@agile/,
      dependencies: ['setup'],
    },
    {
      name: 'chromium-agile',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      grep: /@agile/,
      dependencies: ['setup'],
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? undefined
    : {
        command: 'node e2e/start-playwright-server.mjs',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
})
