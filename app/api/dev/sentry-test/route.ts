import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { applySentrySessionContext } from '@/src/lib/sentry'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }

  const storedSession = await readAuthSession()

  if (storedSession?.token && storedSession.currentTenantId) {
    const validated = await serverApiFetch('login/validar', {
      method: 'POST',
      token: storedSession.token,
      tenantId: storedSession.currentTenantId,
    })

    if (validated.ok) {
      const enrichedPayload = await enrichMasterPayload(
        validated.payload,
        storedSession.token,
        storedSession.currentTenantId,
      )
      applySentrySessionContext(mapAuthSession(enrichedPayload))
    } else {
      applySentrySessionContext(null)
    }
  } else {
    applySentrySessionContext(null)
  }

  const marker = new Date().toISOString()
  const error = new Error('Sentry server test trigger')
  const eventId = Sentry.captureException(error, {
    tags: {
      source: 'manual-test',
      trigger: 'server-route',
      trigger_scope: 'server',
    },
    level: 'error',
    extra: {
      marker,
    },
  })

  await Sentry.flush(2000)

  return NextResponse.json({
    ok: true,
    eventId,
    message: `Server-side error captured (${marker}).`,
  })
}
