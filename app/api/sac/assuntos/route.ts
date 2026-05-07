import { NextResponse } from 'next/server'
import { forwardSearchParams, getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: Request) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const query = forwardSearchParams(request, ['id_sac_area'])
  const result = await serverApiFetch(`sac/admin/assuntos${query ? `?${query}` : ''}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os assuntos do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
