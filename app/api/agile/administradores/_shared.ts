import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'

export async function requireAgileAdministradorSession() {
  const session = await readAuthSession()
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }),
    }
  }

  return { session, response: null }
}

export function getAgileAdministradorErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
      ? payload.error.message
      : fallback
}

export function normalizeAgileAdministradorListPayload(payload: unknown) {
  if (
    typeof payload !== 'object'
    || payload === null
    || !('meta' in payload)
    || typeof payload.meta !== 'object'
    || payload.meta === null
  ) {
    return payload
  }

  const meta = payload.meta as Record<string, unknown>
  return {
    ...payload,
    meta: {
      page: Number(meta.page || 1),
      pages: Number(meta.pages || 1),
      perpage: Number(meta.perpage || meta.perPage || 15),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
      total: Number(meta.total || 0),
      order: meta.order,
      sort: meta.sort,
    },
  }
}
