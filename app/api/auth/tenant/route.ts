import { NextRequest, NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { readAuthSession, writeAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function POST(request: NextRequest) {
  const storedSession = await readAuthSession()

  if (!storedSession?.token) {
    return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 })
  }

  const body = (await request.json()) as { tenantId?: string }
  const tenantId = body.tenantId ?? ''

  if (!tenantId) {
    return NextResponse.json({ message: 'Tenant não informado.' }, { status: 400 })
  }

  const result = await serverApiFetch('login/empresa/alterar', {
    method: 'POST',
    token: storedSession.token,
    tenantId,
    body: { id_empresa: tenantId },
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(result.payload, 'Não foi possível alterar o tenant.') },
      { status: result.status || 400 },
    )
  }

  const enrichedPayload = await enrichMasterPayload(result.payload, storedSession.token, tenantId)
  const session = mapAuthSession(enrichedPayload)
  const response = NextResponse.json(session)
  writeAuthSession(response, {
    token: session.token,
    currentTenantId: session.currentTenant.id,
    currentUserId: session.user.id,
  })
  return response
}
