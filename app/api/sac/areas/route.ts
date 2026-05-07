import { NextResponse } from 'next/server'
import { getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET() {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const result = await serverApiFetch('sac/admin/areas', {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as areas do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function POST(request: Request) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const body = await request.json().catch(() => ({}))
  const result = await serverApiFetch('sac/admin/areas', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar a area do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
