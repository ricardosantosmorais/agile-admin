'use client'

export type SessionClientPhase = 'active' | 'warning' | 'ended'

const SESSION_CLIENT_PHASE_KEY = 'admin-v2-web:session-client-phase'

function getBrowserWindow() {
  if (typeof window === 'undefined') {
    return null
  }

  return window
}

export function getSessionClientPhase(): SessionClientPhase {
  const currentWindow = getBrowserWindow()
  if (!currentWindow) {
    return 'active'
  }

  const stored = currentWindow.sessionStorage.getItem(SESSION_CLIENT_PHASE_KEY)
  return stored === 'warning' || stored === 'ended' ? stored : 'active'
}

export function setSessionClientPhase(phase: SessionClientPhase) {
  const currentWindow = getBrowserWindow()
  if (!currentWindow) {
    return
  }

  currentWindow.sessionStorage.setItem(SESSION_CLIENT_PHASE_KEY, phase)
}

export function clearSessionClientPhase() {
  const currentWindow = getBrowserWindow()
  if (!currentWindow) {
    return
  }

  currentWindow.sessionStorage.removeItem(SESSION_CLIENT_PHASE_KEY)
}
