import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
    if (
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error !== null &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }
  }
  return fallback
}

function fileNameFromKey(key: string) {
  const clean = key.trim().replace(/^\/+/, '')
  const segments = clean.split('/').filter(Boolean)
  return segments[segments.length - 1] || clean
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const params = new URLSearchParams({
    page: '1',
    perpage: '1000',
    id_produto: id,
    order: 'posicao',
    sort: 'asc',
  })

  const result = await serverApiFetch(`produtos/imagens?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar as imagens do produto.') },
      { status: result.status || 400 },
    )
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>> }
  return NextResponse.json(Array.isArray(payload.data) ? payload.data : [])
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()

  if (Array.isArray(body)) {
    const payload = body.map((item) => ({
      id: String((item as Record<string, unknown>).id || ''),
      posicao: Number((item as Record<string, unknown>).posicao || 0),
    }))

    const result = await serverApiFetch('produtos/imagens', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: payload,
    })

    if (!result.ok) {
      return NextResponse.json(
        { message: getErrorMessage(result.payload, 'Não foi possível atualizar a ordem das imagens.') },
        { status: result.status || 400 },
      )
    }

    return NextResponse.json(result.payload)
  }

  const record = body as Record<string, unknown>
  const key = String(record.s3_key || '').trim()
  const fileName = fileNameFromKey(key)
  const persistedKey = key || fileName
  const payload = {
    id_empresa: session.currentTenantId,
    id_produto: id,
    posicao: Number(record.posicao || 1),
    cache_sync: false,
    imagem: persistedKey,
    imagem_thumb: persistedKey,
    arquivo_original: String(record.file_name || fileName),
  }

  const result = await serverApiFetch('produtos/imagens', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível salvar a imagem do produto.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = (await request.json()) as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []
  const payload = ids.map((id) => ({ id, id_empresa: session.currentTenantId }))

  const result = await serverApiFetch('produtos/imagens', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível excluir as imagens do produto.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}
