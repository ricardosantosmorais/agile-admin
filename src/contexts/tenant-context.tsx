'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import type { AuthTenant } from '@/src/features/auth/types/auth'
import { fakeTenants } from '@/src/lib/fake-data'

type TenantContextValue = {
  tenants: AuthTenant[]
  currentTenant: AuthTenant
  isSwitchingTenant: boolean
  switchTenant: (tenantId: string) => Promise<void>
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

export function TenantProvider({ children }: PropsWithChildren) {
  const { session, switchTenant: switchAuthTenant } = useAuth()
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false)

  const value = useMemo<TenantContextValue>(() => ({
    tenants: session?.tenants.length ? session.tenants : fakeTenants,
    currentTenant: session?.currentTenant ?? fakeTenants[0],
    isSwitchingTenant,
    switchTenant: async (tenantId: string) => {
      setIsSwitchingTenant(true)

      try {
        await switchAuthTenant(tenantId)
      } finally {
        setIsSwitchingTenant(false)
      }
    },
  }), [isSwitchingTenant, session, switchAuthTenant])

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) throw new Error('useTenant precisa ser usado dentro de TenantProvider')
  return context
}
