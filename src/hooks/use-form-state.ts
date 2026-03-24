'use client'

import { useCallback, useState } from 'react'

export function useFormState<TState>(initialState: TState) {
  const [state, setState] = useState<TState>(initialState)

  const patch = useCallback(<K extends keyof TState>(key: K, value: TState[K]) => {
    setState((current) => ({ ...current, [key]: value }))
  }, [])

  const patchIn = useCallback(
    <K extends keyof TState, TNestedKey extends keyof NonNullable<TState[K]>>(
      key: K,
      nestedKey: TNestedKey,
      value: NonNullable<TState[K]>[TNestedKey],
    ) => {
      setState((current) => ({
        ...current,
        [key]: {
          ...(current[key] as NonNullable<TState[K]>),
          [nestedKey]: value,
        },
      }))
    },
    [],
  )

  return {
    state,
    setState,
    patch,
    patchIn,
  }
}
