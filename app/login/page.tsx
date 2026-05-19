import { Suspense } from 'react'
import { LoginPage } from '@/src/features/auth/components/login-page'

export default async function LoginRoutePage() {
  const defaultEmail = process.env.PLAYWRIGHT_AUTH_EMAIL || undefined
  const defaultPassword = process.env.PLAYWRIGHT_AUTH_PASSWORD || undefined

  return (
    <Suspense fallback={null}>
      <LoginPage defaultEmail={defaultEmail} defaultPassword={defaultPassword} />
    </Suspense>
  )
}
