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

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })

  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams()
  params.set('page', searchParams.get('page') || '1')
  params.set('perpage', searchParams.get('perPage') || '15')
  params.set('order', searchParams.get('orderBy') || 'id_produto')
  params.set('sort', searchParams.get('sort') || 'asc')
  params.set('embed', 'produto,departamento')

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) continue
    params.set(key, value)
  }

  const result = await serverApiFetch(`produtos/departamentos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel carregar os relacionamentos.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: unknown[]; meta?: Record<string, unknown> }
  return NextResponse.json({
    ...payload,
    meta: {
      page: Number(payload?.meta?.page || 1),
      pages: Number(payload?.meta?.pages || 1),
      perPage: Number(payload?.meta?.perpage || payload?.meta?.perPage || 15),
      from: Number(payload?.meta?.from || 0),
      to: Number(payload?.meta?.to || 0),
      total: Number(payload?.meta?.total || 0),
      order: typeof payload?.meta?.order === 'string' ? payload.meta.order : '',
      sort: typeof payload?.meta?.sort === 'string' ? payload.meta.sort : '',
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  const body = await request.json() as { items?: Array<{ id_produto?: string; id_departamento?: string; departamento_pai?: string }> }
  const items = Array.isArray(body.items) ? body.items : []

  const departamentosPaiPorProduto = new Map<string, string>()
  const produtoIds = new Set<string>()
  for (const item of items) {
    if (item.id_produto) {
      produtoIds.add(item.id_produto)
      if (item.departamento_pai) {
        departamentosPaiPorProduto.set(item.id_produto, item.departamento_pai)
      }
    }
  }

  if (produtoIds.size) {
    const ids = Array.from(produtoIds)
    const produtosResult = await serverApiFetch(`produtos?perpage=10000&q=id in('${ids.join("','")}')`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })

    if (!produtosResult.ok) {
      return NextResponse.json({ message: getErrorMessage(produtosResult.payload, 'Nao foi possivel carregar os produtos para atualizar o departamento pai.') }, { status: produtosResult.status || 400 })
    }

    const produtosPayload = produtosResult.payload as { data?: Array<Record<string, unknown>> }
    const produtos = Array.isArray(produtosPayload.data) ? produtosPayload.data : []
    const produtosAtualizados = produtos.map((produto) => {
      const id = typeof produto.id === 'string' ? produto.id : ''
      return {
        ...produto,
        id_departamento: departamentosPaiPorProduto.get(id) || produto.id_departamento || null,
      }
    }).map((produto) => {
      const sanitized = { ...(produto as Record<string, unknown>) }
      delete sanitized.created_at
      delete sanitized.updated_at
      delete sanitized.deleted_at
      return sanitized
    })

    if (produtosAtualizados.length) {
      const updateResult = await serverApiFetch('produtos', {
        method: 'POST',
        token: session.token,
        tenantId: session.currentTenantId,
        body: produtosAtualizados,
      })

      if (!updateResult.ok) {
        return NextResponse.json({ message: getErrorMessage(updateResult.payload, 'Nao foi possivel atualizar o departamento principal dos produtos.') }, { status: updateResult.status || 400 })
      }
    }
  }

  const result = await serverApiFetch('produtos/departamentos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: items.map((item) => ({
      id_empresa: session.currentTenantId,
      id_produto: item.id_produto || null,
      id_departamento: item.id_departamento || null,
    })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar os relacionamentos.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  const body = await request.json() as { items?: Array<{ id_produto?: string; id_departamento?: string }> }
  const items = Array.isArray(body.items) ? body.items : []

  const result = await serverApiFetch('produtos/departamentos', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: items.map((item) => ({
      id_produto: item.id_produto || null,
      id_departamento: item.id_departamento || null,
    })),
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel excluir os relacionamentos.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
