import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { LoginPage } from '@/src/features/auth/components/login-page'
import { readAuthSession } from '@/src/features/auth/services/auth-session'

export default async function LoginRoutePage() {
  const session = await readAuthSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  )
}
