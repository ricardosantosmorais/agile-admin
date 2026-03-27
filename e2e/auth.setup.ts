import { test as setup } from '@playwright/test'
import path from 'node:path'
import { loginWithUi } from '@/e2e/helpers/auth'

const authFile = path.join(process.cwd(), 'playwright', '.auth', 'user.json')

setup.setTimeout(90_000)

setup('authenticate', async ({ page }) => {
  await loginWithUi(page)
  await page.context().storageState({ path: authFile })
})
