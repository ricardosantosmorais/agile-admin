import { Suspense } from 'react'
import { LoginPage } from '@/src/features/auth/components/login-page'

export default async function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  )
}
