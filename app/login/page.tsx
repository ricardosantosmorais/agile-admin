'use client'

import { Suspense } from 'react'
import { PublicRoute } from '@/src/features/auth/components/auth-guards'
import { LoginPage } from '@/src/features/auth/components/login-page'

export default function LoginRoutePage() {
  return (
    <PublicRoute>
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </PublicRoute>
  )
}
