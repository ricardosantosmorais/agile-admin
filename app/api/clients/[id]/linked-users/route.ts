import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import type { ClientLinkedUser } from '@/src/features/clientes/types/clientes'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapLinkedUsers(payload: unknown): ClientLinkedUser[] {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return []
  }

  return payload.data.map((item) => {
    const row = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
    const usuario = typeof row.usuario === 'object' && row.usuario !== null ? row.usuario as Record<string, unknown> : {}

    return {
      idCliente: typeof row.id_cliente === 'string' ? row.id_cliente : '',
      idUsuario: typeof row.id_usuario === 'string' ? row.id_usuario : '',
      email: typeof usuario.email === 'string' ? usuario.email : '',
      dataAtivacao: typeof row.data_ativacao === 'string' ? row.data_ativacao : '',
    }
  })
}

function getMessage(payload: unknown, fallback: string) {
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`usuarios/clientes?id_cliente=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getMessage(result.payload, 'Nao foi possivel carregar os usuarios vinculados.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapLinkedUsers(result.payload))
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()
  const userId = typeof body.userId === 'string' ? body.userId : ''

  const result = await serverApiFetch('usuarios/clientes', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [{
      id_empresa: session.currentTenantId,
      id_cliente: id,
      id_usuario: userId,
    }],
  })

  if (!result.ok) {
    return NextResponse.json({ message: getMessage(result.payload, 'Nao foi possivel remover o usuario vinculado.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
