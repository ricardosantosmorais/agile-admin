'use client'

import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { RouteParamsProvider } from './route-context'

function normalizeParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (!value) {
        return []
      }

      return [[key, Array.isArray(value) ? value[0] ?? '' : value]]
    }),
  )
}

export function ParamsBridge({ children }: { children: ReactNode }) {
  const params = useParams<Record<string, string | string[] | undefined>>()

  return <RouteParamsProvider params={normalizeParams(params)}>{children}</RouteParamsProvider>
}
