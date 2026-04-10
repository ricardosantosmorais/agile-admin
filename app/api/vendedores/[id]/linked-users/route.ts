import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
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

function extractFirstRecord(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) {
    return null
  }

  if ('id' in payload) {
    return payload as Record<string, unknown>
  }

  if ('data' in payload && Array.isArray(payload.data)) {
    return payload.data[0] && typeof payload.data[0] === 'object' ? payload.data[0] as Record<string, unknown> : null
  }

  return null
}

async function loadVendedorRecord(id: string, session: NonNullable<Awaited<ReturnType<typeof readAuthSession>>>) {
  const detailResult = await serverApiFetch(`vendedores/${id}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (detailResult.ok) {
    return {
      result: detailResult,
      record: extractFirstRecord(detailResult.payload),
    }
  }

  if (detailResult.status !== 404) {
    return {
      result: detailResult,
      record: null,
    }
  }

  const params = new URLSearchParams({
    page: '1',
    perpage: '1',
    order: 'id',
    sort: 'asc',
    id,
  })
  const listResult = await serverApiFetch(`vendedores?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  return {
    result: listResult,
    record: listResult.ok ? extractFirstRecord(listResult.payload) : null,
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const { result: vendedorResult, record: vendedor } = await loadVendedorRecord(id, session)

  if (!vendedorResult.ok) {
    return NextResponse.json({ message: getErrorMessage(vendedorResult.payload, 'Nao foi possivel carregar o vendedor.') }, { status: vendedorResult.status || 400 })
  }

  const userId = vendedor && vendedor.id_usuario != null ? String(vendedor.id_usuario).trim() : ''
  if (!userId) {
    return NextResponse.json([])
  }

  const usuarioResult = await serverApiFetch(`usuarios/${userId}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!usuarioResult.ok) {
    if (usuarioResult.status === 404) {
      return NextResponse.json([])
    }

    return NextResponse.json({ message: getErrorMessage(usuarioResult.payload, 'Nao foi possivel carregar os usuarios vinculados.') }, { status: usuarioResult.status || 400 })
  }

  const usuario = extractFirstRecord(usuarioResult.payload)
  if (!usuario) {
    return NextResponse.json([])
  }

  return NextResponse.json([{
    id: String(usuario.id || userId),
    idUsuario: String(usuario.id || userId),
    email: String(usuario.email || ''),
    nome: String(usuario.nome || ''),
  }])
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json() as { userId?: string }

  const { result: vendedorResult, record: vendedor } = await loadVendedorRecord(id, session)

  if (!vendedorResult.ok) {
    return NextResponse.json({ message: getErrorMessage(vendedorResult.payload, 'Nao foi possivel carregar o vendedor.') }, { status: vendedorResult.status || 400 })
  }

  if (!vendedor) {
    return NextResponse.json({ message: 'Vendedor nao encontrado.' }, { status: 404 })
  }

  const payload: Record<string, unknown> = {
    ...vendedor,
    id_usuario: null,
  }

  delete payload.created_at
  delete payload.updated_at
  delete payload.deleted_at

  if (body.userId && String(vendedor.id_usuario || '').trim() !== body.userId) {
    return NextResponse.json({ message: 'Usuario vinculado nao confere com o vendedor informado.' }, { status: 400 })
  }

  const saveResult = await serverApiFetch('vendedores', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!saveResult.ok) {
    return NextResponse.json({ message: getErrorMessage(saveResult.payload, 'Nao foi possivel remover o usuario vinculado.') }, { status: saveResult.status || 400 })
  }

  return NextResponse.json({ success: true })
}
