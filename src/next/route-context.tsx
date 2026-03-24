'use client'

import { createContext, useContext } from 'react'

type RouteParams = Record<string, string>

const RouteParamsContext = createContext<RouteParams>({})

export function RouteParamsProvider({
  children,
  params,
}: {
  children: React.ReactNode
  params: RouteParams
}) {
  return <RouteParamsContext.Provider value={params}>{children}</RouteParamsContext.Provider>
}

export function useRouteParams<T extends RouteParams>() {
  return useContext(RouteParamsContext) as T
}
