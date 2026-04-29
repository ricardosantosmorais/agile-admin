import { NextRequest, NextResponse } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet } from '@/src/services/http/crud-route'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import { captureOperationalServerError } from '@/src/lib/sentry'
import { syncAppsClientsJsonToGithub, triggerGithubRepositoryDispatch } from '@/app/api/apps/_apps-github'
import type { CrudRecord } from '@/src/components/crud-base/types'

const config = { resource: 'apps' as const, listEmbed: 'last_log' }

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }
  return fallback
}

function normalizeSavedPayload(payload: unknown): CrudRecord[] {
  if (Array.isArray(payload)) return payload as CrudRecord[]
  if (typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: CrudRecord[] }).data
  }
  if (typeof payload === 'object' && payload !== null) return [payload as CrudRecord]
  return []
}

export function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as CrudRecord
  const isNew = !String(body.id ?? '').trim()
  const result = await serverApiFetch('apps', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [body],
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar o app.') }, { status: result.status || 400 })
  }

  try {
    await syncAppsClientsJsonToGithub(session.token, session.currentTenantId)
    if (isNew) {
      const clientKey = String(body.chave_cliente ?? '').trim()
      if (clientKey) {
        await triggerGithubRepositoryDispatch('init_match_client', { client_key: clientKey })
      }
    }
  } catch (error) {
    captureOperationalServerError({
      area: 'apps',
      action: 'github-sync-after-save',
      path: '/api/apps',
      status: 200,
      tenantId: session.currentTenantId,
      payload: { message: error instanceof Error ? error.message : 'GitHub sync failed' },
    })
  }

  return NextResponse.json(normalizeSavedPayload(result.payload))
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
