import { NextRequest, NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { clearAuthSession, readAuthSession, writeAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(request: NextRequest) {
  const storedSession = await readAuthSession()

  if (!storedSession?.token) {
    return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 })
  }

  const requestedTenantId = request.nextUrl.searchParams.get('tenantId') ?? ''
  const desiredTenantId = requestedTenantId || storedSession.currentTenantId
  const validated = await serverApiFetch('login/validar', {
    method: 'POST',
    token: storedSession.token,
    tenantId: desiredTenantId,
  })

  if (!validated.ok) {
    const response = NextResponse.json(
      { message: extractApiErrorMessage(validated.payload, 'Sessão inválida.') },
      { status: 401 },
    )
    clearAuthSession(response)
    return response
  }

  const enrichedValidatedPayload = await enrichMasterPayload(validated.payload, storedSession.token, desiredTenantId)
  let session = mapAuthSession(enrichedValidatedPayload)

  if (
    desiredTenantId
    && desiredTenantId !== session.currentTenant.id
    && session.tenants.some((tenant) => tenant.id === desiredTenantId)
  ) {
    const switched = await serverApiFetch('login/empresa/alterar', {
      method: 'POST',
      token: session.token,
      tenantId: desiredTenantId,
      body: { id_empresa: desiredTenantId },
    })

    if (!switched.ok) {
      return NextResponse.json(
        { message: extractApiErrorMessage(switched.payload, 'Não foi possível alterar o tenant.') },
        { status: switched.status || 400 },
      )
    }

    const enrichedSwitchedPayload = await enrichMasterPayload(switched.payload, session.token, desiredTenantId)
    session = mapAuthSession(enrichedSwitchedPayload)
  }

  const response = NextResponse.json(session)
  writeAuthSession(response, {
    token: session.token,
    currentTenantId: session.currentTenant.id,
    currentUserId: session.user.id,
  })
  return response
}
