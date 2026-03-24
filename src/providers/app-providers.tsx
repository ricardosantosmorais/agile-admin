'use client'

import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/src/contexts/auth-context'
import { SessionLifecycleProvider } from '@/src/contexts/session-lifecycle-context'
import { TenantProvider } from '@/src/contexts/tenant-context'
import { UiProvider } from '@/src/contexts/ui-context'
import { I18nProvider } from '@/src/i18n/context'
import type { Locale } from '@/src/i18n/types'

type AppProvidersProps = PropsWithChildren<{
  initialLocale: Locale
}>

export function AppProviders({ children, initialLocale }: AppProvidersProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <UiProvider>
        <AuthProvider>
          <SessionLifecycleProvider>
            <TenantProvider>{children}</TenantProvider>
          </SessionLifecycleProvider>
        </AuthProvider>
      </UiProvider>
    </I18nProvider>
  )
}
