import { createHmac } from 'node:crypto'
import type { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
type StoredAuthSession = {
  token: string
  currentTenantId: string
  currentUserId: string
}

const AUTH_COOKIE_NAME = 'admin_v2_web_session'
const AUTH_COOKIE_TTL_SECONDS = 60 * 60 * 12

function getSecret() {
  return process.env.AUTH_SESSION_SECRET || 'admin-v2-web-dev-secret'
}

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === 'true') {
    return true
  }

  if (process.env.AUTH_COOKIE_SECURE === 'false') {
    return false
  }

  return process.env.NODE_ENV === 'production'
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function encodeSession(session: StoredAuthSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function createAuthSessionCookieValue(session: StoredAuthSession) {
  return encodeSession(session)
}

function decodeSession(value: string): StoredAuthSession | null {
  const [payload, signature] = value.split('.')

  if (!payload || !signature || sign(payload) !== signature) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as StoredAuthSession
  } catch {
    return null
  }
}

export async function readAuthSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return raw ? decodeSession(raw) : null
}

export function writeAuthSession(response: NextResponse, session: StoredAuthSession) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    maxAge: AUTH_COOKIE_TTL_SECONDS,
  })
}

export function clearAuthSession(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    maxAge: 0,
  })
}
