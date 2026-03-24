'use client'

import type { ReactNode } from 'react'
import { AuthShell } from '@/src/layouts/auth-shell'
import { ProtectedRoute } from '@/src/features/auth/components/auth-guards'

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AuthShell>{children}</AuthShell>
    </ProtectedRoute>
  )
}
