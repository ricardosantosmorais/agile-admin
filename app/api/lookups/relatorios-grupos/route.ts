import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

function asArray(value: unknown): ApiRecord[] {
  if (typeof value !== 'object' || value === null || !('data' in value) || !Array.isArray(value.data)) {
    return []
  }
  return value.data as ApiRecord[]
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const id = request.nextUrl.searchParams.get('id')?.trim() ?? ''
  const params = new URLSearchParams({
    page: '1',
    perpage: id ? '1' : String(request.nextUrl.searchParams.get('perPage') || 20),
    order: 'nome',
    sort: 'asc',
  })

  if (id) params.set('id', id)
  if (!id && q) params.set('nome::like', q)

  const result = await serverApiFetch(`relatorios/grupos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Nao foi possivel carregar os grupos de relatorio.' }, { status: result.status || 400 })
  }

  return NextResponse.json(asArray(result.payload).map((row) => {
    const value = String(row.id ?? '').trim()
    const nome = String(row.nome ?? value).trim()
    return { value, label: value && nome !== value ? `${nome} - ${value}` : nome }
  }).filter((option) => option.value))
}
