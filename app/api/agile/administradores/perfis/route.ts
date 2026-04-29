import { NextRequest, NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'
import { getAgileAdministradorErrorMessage, requireAgileAdministradorSession } from '@/app/api/agile/administradores/_shared'

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireAgileAdministradorSession()
  if (!session) return response

  const searchParams = request.nextUrl.searchParams
  const q = (searchParams.get('q') || '').trim()
  const idEmpresa = (searchParams.get('idEmpresa') || '').trim()
  const params = new URLSearchParams({
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '20',
    order: 'nome',
    sort: 'asc',
    ativo: '1',
    fields: 'ativo,id,id_empresa,nome',
  })

  if (idEmpresa) {
    params.set('id_empresa', idEmpresa)
  }
  if (q) {
    params.set('nome::like', q)
  }

  const result = await serverApiFetch(`perfis?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getAgileAdministradorErrorMessage(result.payload, 'Não foi possível carregar os perfis.') }, { status: result.status || 400 })
  }

  const payload = asRecord(result.payload)
  const rows = Array.isArray(payload.data) ? payload.data : []
  return NextResponse.json({
    data: rows.map((row) => {
      const item = asRecord(row)
      const id = String(item.id ?? '').trim()
      const nome = String(item.nome ?? id).trim()
      return {
        id,
        label: nome,
        description: String(item.id_empresa ?? '').trim() || undefined,
      }
    }).filter((item) => item.id),
  })
}
