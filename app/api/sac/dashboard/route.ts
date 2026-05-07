import { NextResponse } from 'next/server'
import { forwardSearchParams, getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: Request) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const query = forwardSearchParams(request, ['data_inicial', 'data_final', 'id_usuario_responsavel'])
  const result = await serverApiFetch(`sac/admin/dashboard${query ? `?${query}` : ''}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar o dashboard do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
