import { NextRequest, NextResponse } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet } from '@/src/services/http/crud-route'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

const config = { resource: 'emails_templates' as const }

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

function formatNowSql() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

export function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
  const id = String(payload.id || '').trim()

  if (id) {
    const currentTemplateResult = await serverApiFetch(`emails_templates/${encodeURIComponent(id)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })

    if (currentTemplateResult.ok) {
      const currentTemplate = (
        typeof currentTemplateResult.payload === 'object'
        && currentTemplateResult.payload !== null
        && !Array.isArray(currentTemplateResult.payload)
      ) ? currentTemplateResult.payload as Record<string, unknown> : null

      if (currentTemplate && currentTemplate.id && typeof currentTemplate.html === 'string') {
        await serverApiFetch('emails_templates_historico', {
          method: 'POST',
          token: session.token,
          tenantId: session.currentTenantId,
          body: {
            id_empresa: session.currentTenantId,
            id_registro: String(currentTemplate.id),
            id_usuario: session.currentUserId,
            data: formatNowSql(),
            html: currentTemplate.html,
          },
        })
      }
    }
  }

  const result = await serverApiFetch(config.resource, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...payload,
      id_empresa: session.currentTenantId,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o registro.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
