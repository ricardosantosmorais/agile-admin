import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })

  const { id } = await context.params
  const body = await request.json() as { urls?: string[] }
  const urls = Array.isArray(body.urls)
    ? body.urls.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

  const deleteResult = await serverApiFetch('banners/urls', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [{ id_empresa: session.currentTenantId, id_banner: id }],
  })

  if (!deleteResult.ok) {
    return NextResponse.json({ message: getErrorMessage(deleteResult.payload, 'Nao foi possivel limpar as URLs do banner.') }, { status: deleteResult.status || 400 })
  }

  if (!urls.length) {
    return NextResponse.json({ success: true })
  }

  const postResult = await serverApiFetch('banners/urls', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: urls.map((url) => ({
      id_empresa: session.currentTenantId,
      id_banner: id,
      url,
    })),
  })

  if (!postResult.ok) {
    return NextResponse.json({ message: getErrorMessage(postResult.payload, 'Nao foi possivel salvar as URLs do banner.') }, { status: postResult.status || 400 })
  }

  return NextResponse.json(postResult.payload)
}
