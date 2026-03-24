import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ProdutoEmbalagemRecord = {
  id?: string | null
  nome?: string | null
  unidade?: string | null
  quantidade?: string | number | null
}

function getLabel(item: ProdutoEmbalagemRecord) {
  const nome = String(item.nome || '').trim()
  const unidade = String(item.unidade || '').trim()
  const quantidade = item.quantidade === null || item.quantidade === undefined ? '' : String(item.quantidade).trim()
  const id = getOptionValue(item)

  const base = nome || [unidade, quantidade].filter(Boolean).join(' / ') || id
  return id && base !== id ? `${base} - ${id}` : base
}

function getOptionValue(item: ProdutoEmbalagemRecord) {
  const primaryId = String(item.id || '').trim()
  return primaryId.length <= 32 ? primaryId : ''
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const productId = (request.nextUrl.searchParams.get('id_produto') || '').trim()
  if (!productId) {
    return NextResponse.json([], { status: 200 })
  }

  const params = new URLSearchParams({
    id_produto: productId,
    fields: 'produtos_embalagens.id,produtos_embalagens.nome',
    page: '1',
    perpage: '200',
    order: 'nome',
    sort: 'asc',
  })

  const result = await serverApiFetch(`produtos_embalagens?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Nao foi possivel carregar as embalagens.' }, { status: result.status || 400 })
  }

  const payload = typeof result.payload === 'object' && result.payload !== null && 'data' in result.payload && Array.isArray(result.payload.data)
    ? result.payload.data as ProdutoEmbalagemRecord[]
    : Array.isArray(result.payload)
      ? result.payload as ProdutoEmbalagemRecord[]
      : []

  return NextResponse.json(
    payload
      .map((item) => ({
        value: getOptionValue(item),
        label: getLabel(item),
      }))
      .filter((item) => item.value)
      .map((item) => ({
        value: item.value,
        label: item.label,
      })),
  )
}
