'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import type { AuthTenant } from '@/src/features/auth/types/auth'

type TenantContextValue = {
  tenants: AuthTenant[]
  currentTenant: AuthTenant
  isSwitchingTenant: boolean
  switchTenant: (tenantId: string) => Promise<void>
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)
const EMPTY_TENANT: AuthTenant = { id: '', nome: '', codigo: '', status: '' }

export function TenantProvider({ children }: PropsWithChildren) {
  const { session, switchTenant: switchAuthTenant } = useAuth()
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false)

  const value = useMemo<TenantContextValue>(() => {
    const tenants = session?.tenants ?? []
    const currentTenant = session?.currentTenant ?? tenants[0] ?? EMPTY_TENANT

    return {
      tenants,
      currentTenant,
      isSwitchingTenant,
      switchTenant: async (tenantId: string) => {
        setIsSwitchingTenant(true)

        try {
          await switchAuthTenant(tenantId)
        } finally {
          setIsSwitchingTenant(false)
        }
      },
    }
  }, [isSwitchingTenant, session, switchAuthTenant])

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) throw new Error('useTenant precisa ser usado dentro de TenantProvider')
  return context
}
