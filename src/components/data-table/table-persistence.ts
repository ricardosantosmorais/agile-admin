export function readSessionState<TState>(storageKey: string): TState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as TState) : null
  } catch {
    return null
  }
}

export function writeSessionState<TState>(storageKey: string, value: TState) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(value))
}
