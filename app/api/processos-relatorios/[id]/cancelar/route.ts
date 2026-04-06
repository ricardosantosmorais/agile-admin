import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { extractApiErrorMessage } from '@/app/api/relatorios/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const result = await serverApiFetch('processos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [{ id, status: 'cancelado' }],
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(result.payload, 'Não foi possível cancelar o processo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}
