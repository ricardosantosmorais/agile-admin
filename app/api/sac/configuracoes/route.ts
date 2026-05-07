import { NextResponse } from 'next/server'
import { getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET() {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const result = await serverApiFetch('sac/admin/configuracoes', {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar as configuracoes do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function POST(request: Request) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const body = await request.json().catch(() => ({}))
  const result = await serverApiFetch('sac/admin/configuracoes', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar as configuracoes do SAC.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
