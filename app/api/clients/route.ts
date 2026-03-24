import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildClientSavePayload, mapClientListResponse } from '@/src/features/clientes/services/clientes-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

function appendDateRange(params: URLSearchParams, field: string, fromValue: string | null, toValue: string | null) {
  if (fromValue) {
    params.set(`${field}::ge`, `${fromValue} 00:00:00`)
  }

  if (toValue) {
    params.set(`${field}::le`, `${toValue} 23:59:59`)
  }
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams()

  params.set('page', searchParams.get('page') || '1')
  params.set('perpage', searchParams.get('perPage') || '15')
  params.set('order', searchParams.get('orderBy') || 'razao_social')
  params.set('sort', searchParams.get('sort') || 'asc')

  const codigo = (searchParams.get('codigo') || '').trim()
  const cnpjCpf = (searchParams.get('cnpjCpf') || '').replace(/\D/g, '')
  const nomeRazaoSocial = (searchParams.get('nomeRazaoSocial') || '').trim()
  const qtdPedidosFrom = (searchParams.get('qtdPedidosFrom') || '').trim()
  const qtdPedidosTo = (searchParams.get('qtdPedidosTo') || '').trim()

  if (codigo) {
    params.set('codigo', codigo)
  }

  if (cnpjCpf) {
    params.set('cnpj_cpf', cnpjCpf)
  }

  if (nomeRazaoSocial) {
    params.set('razao_social::like', nomeRazaoSocial)
  }

  appendDateRange(
    params,
    'data_ativacao',
    searchParams.get('dataAtivacaoFrom'),
    searchParams.get('dataAtivacaoTo'),
  )
  appendDateRange(
    params,
    'ultimo_pedido',
    searchParams.get('ultimoPedidoFrom'),
    searchParams.get('ultimoPedidoTo'),
  )

  if (qtdPedidosFrom) {
    params.set('qtd_pedidos::ge', qtdPedidosFrom)
  }

  if (qtdPedidosTo) {
    params.set('qtd_pedidos::le', qtdPedidosTo)
  }

  for (const booleanField of ['bloqueado', 'bloqueadoPlataforma', 'ativo'] as const) {
    const value = (searchParams.get(booleanField) || '').trim()
    if (value !== '') {
      params.set(booleanField === 'bloqueadoPlataforma' ? 'bloqueado_plataforma' : booleanField, value)
    }
  }

  const result = await serverApiFetch(`clientes?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    const message =
      typeof result.payload === 'object'
      && result.payload !== null
      && 'error' in result.payload
      && typeof result.payload.error === 'object'
      && result.payload.error !== null
      && 'message' in result.payload.error
      && typeof result.payload.error.message === 'string'
        ? result.payload.error.message
        : 'Nao foi possivel carregar os clientes.'

    return NextResponse.json({ message }, { status: result.status || 400 })
  }

  return NextResponse.json(mapClientListResponse(result.payload))
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json()
  const payload = buildClientSavePayload(body)

  const result = await serverApiFetch('clientes', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    const message =
      typeof result.payload === 'object'
      && result.payload !== null
      && 'error' in result.payload
      && typeof result.payload.error === 'object'
      && result.payload.error !== null
      && 'message' in result.payload.error
      && typeof result.payload.error.message === 'string'
        ? result.payload.error.message
        : 'Nao foi possivel salvar o cliente.'

    return NextResponse.json({ message }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json()
  const ids = Array.isArray(body.ids)
    ? (body.ids as unknown[]).filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

  const result = await serverApiFetch('clientes', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: ids.map((id) => ({ id })),
  })

  if (!result.ok) {
    const message =
      typeof result.payload === 'object'
      && result.payload !== null
      && 'error' in result.payload
      && typeof result.payload.error === 'object'
      && result.payload.error !== null
      && 'message' in result.payload.error
      && typeof result.payload.error.message === 'string'
        ? result.payload.error.message
        : 'Nao foi possivel excluir o cliente.'

    return NextResponse.json({ message }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
