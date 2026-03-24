import { NextResponse } from 'next/server'
import { clearAuthSession, readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function POST() {
  const storedSession = await readAuthSession()

  if (storedSession?.token) {
    await serverApiFetch('login/sair', {
      method: 'POST',
      token: storedSession.token,
      tenantId: storedSession.currentTenantId,
    })
  }

  const response = NextResponse.json({ success: true })
  clearAuthSession(response)
  return response
}
