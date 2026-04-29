import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getAgileAdministradorErrorMessage, requireAgileAdministradorSession } from '@/app/api/agile/administradores/_shared'

function asString(value: unknown) {
  return String(value ?? '').trim()
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const { id } = await context.params
  const body = await request.json() as Record<string, unknown>
  const idEmpresa = asString(body.id_empresa)
  const idPerfil = asString(body.id_perfil)

  if (!idEmpresa || !idPerfil) {
    return NextResponse.json({ message: 'Informe empresa e perfil para inclusão.' }, { status: 400 })
  }

  const result = await serverApiFetch('administradores/empresas', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      id_usuario: id,
      id_empresa: idEmpresa,
      id_perfil: idPerfil,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível vincular a empresa.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const { id } = await context.params
  const body = await request.json() as { links?: unknown[] }
  const links = Array.isArray(body.links) ? body.links : []
  const payload = links
    .map((link) => {
      const item = typeof link === 'object' && link !== null ? link as Record<string, unknown> : {}
      return {
        id_usuario: asString(item.idUsuario || item.id_usuario || id),
        id_empresa: asString(item.idEmpresa || item.id_empresa),
        id_perfil: asString(item.idPerfil || item.id_perfil) || null,
      }
    })
    .filter((link) => link.id_usuario && link.id_empresa)

  if (!payload.length) {
    return NextResponse.json({ message: 'Selecione um ou mais vínculos para exclusão.' }, { status: 400 })
  }

  const result = await serverApiFetch('administradores/empresas', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível remover as empresas.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
