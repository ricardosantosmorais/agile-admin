import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getAgileAdministradorErrorMessage, requireAgileAdministradorSession } from '@/app/api/agile/administradores/_shared'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const { id } = await context.params
  const params = new URLSearchParams()
  const embed = request.nextUrl.searchParams.get('embed') || 'usuarios_empresas.empresa,usuarios_empresas.perfil,perfil'
  if (embed) {
    params.set('embed', embed)
  }

  const query = params.size ? `?${params.toString()}` : ''
  const result = await serverApiFetch(`administradores/${id}${query}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível carregar o administrador.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
