import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getAgileAdministradorErrorMessage, requireAgileAdministradorSession } from '@/app/api/agile/administradores/_shared'

export async function POST(request: NextRequest) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const body = await request.json()
  const result = await serverApiFetch('login/senha/alterar', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível alterar a senha.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
