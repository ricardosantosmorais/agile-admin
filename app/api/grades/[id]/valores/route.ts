import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }
  return fallback
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json()
  const payload = Array.isArray(body)
    ? body.map((item) => ({ ...item, id_grade: id }))
    : {
        ...body,
        id_grade: id,
      }

  const result = await serverApiFetch('grades_valores', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o valor da grade.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []

  const result = await serverApiFetch('grades_valores', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((valueId) => ({ id_grade: id, id: valueId })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel remover os valores da grade.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
