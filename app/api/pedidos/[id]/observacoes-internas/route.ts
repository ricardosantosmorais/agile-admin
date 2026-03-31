import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { updatePedido } from '@/app/api/pedidos/_shared'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const observacoesInternas = typeof body?.observacoes_internas === 'string' ? body.observacoes_internas : ''

  const result = await updatePedido(session, {
    id,
    observacoes_internas: observacoesInternas,
  })

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true, id })
}
