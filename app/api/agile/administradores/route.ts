import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import {
  getAgileAdministradorErrorMessage,
  normalizeAgileAdministradorListPayload,
  requireAgileAdministradorSession,
} from '@/app/api/agile/administradores/_shared'

export async function GET(request: NextRequest) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const searchParams = request.nextUrl.searchParams
  const idEmpresa = (searchParams.get('idEmpresa') || '').trim()
  const params = new URLSearchParams({
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    order: searchParams.get('orderBy') || 'nome',
    sort: searchParams.get('sort') || 'asc',
    embed: 'empresa',
  })

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort', 'idEmpresa', 'idEmpresa_label'].includes(key) || !value.trim()) {
      continue
    }
    if (key === 'ultimo_acesso::ge') {
      params.set(key, `${value} 00:00:00`)
      continue
    }
    if (key === 'ultimo_acesso::le') {
      params.set(key, `${value} 23:59:59`)
      continue
    }
    params.set(key, value)
  }

  if (idEmpresa) {
    params.set('q', `(usuarios.id_empresa = '${idEmpresa}';; or id IN(select id_usuario from usuarios_empresas where id_empresa in('${idEmpresa}')))`)
  }

  const result = await serverApiFetch(`administradores?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível carregar os administradores.') }, { status: result.status || 400 })
  }

  return NextResponse.json(normalizeAgileAdministradorListPayload(result.payload))
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const body = await request.json() as Record<string, unknown>
  const isEditing = Boolean(String(body.id ?? '').trim())
  const payload = { ...body }

  if (!isEditing) {
    payload.id_empresa = '0000000000000000'
  } else {
    delete payload.id_empresa
  }

  const result = await serverApiFetch('administradores', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível salvar o administrador.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const body = await request.json() as { ids?: unknown[] }
  const ids = Array.isArray(body.ids)
    ? body.ids.map((id) => String(id ?? '').trim()).filter(Boolean)
    : []

  const result = await serverApiFetch('administradores', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível excluir os administradores.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
