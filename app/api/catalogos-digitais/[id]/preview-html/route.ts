import { renderCatalogoDigitalPreviewHtml } from '@/src/features/catalogos-digitais/services/catalogos-digitais-preview-renderer'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') return payload.message
  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) return payload.error.message
  return fallback
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function errorHtml(message: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Prévia indisponível</title></head><body>${message}</body></html>`
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await readAuthSession()
  if (!session) {
    return htmlResponse(errorHtml('Sessão expirada.'), 401)
  }

  const { id } = await context.params
  const params = new URLSearchParams()
  params.set('id_empresa', session.currentTenantId)
  params.set('id', id)
  params.set('embed', 'produtos')
  params.set('perpage', '1')

  const result = await serverApiFetch(`catalogos_digitais?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return htmlResponse(errorHtml(getErrorMessage(result.payload, 'Não foi possível gerar a prévia HTML do catálogo digital.')), result.status || 400)
  }

  return htmlResponse(renderCatalogoDigitalPreviewHtml(result.payload))
}
