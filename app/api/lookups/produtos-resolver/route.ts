import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ProdutoRecord = {
  id?: string | null
  nome?: string | null
}

async function findProduto(token: string, authToken: string, tenantId: string) {
  const byIdResult = await serverApiFetch(`produtos?id=${encodeURIComponent(token)}&page=1&perpage=1`, {
    method: 'GET',
    token: authToken,
    tenantId,
  })

  const byId = typeof byIdResult.payload === 'object' && byIdResult.payload !== null && 'data' in byIdResult.payload && Array.isArray(byIdResult.payload.data)
    ? byIdResult.payload.data[0] as ProdutoRecord | undefined
    : undefined

  if (byIdResult.ok && byId?.id) {
    return byId
  }

  const byCodeResult = await serverApiFetch(`produtos?codigo=${encodeURIComponent(token)}&page=1&perpage=1`, {
    method: 'GET',
    token: authToken,
    tenantId,
  })

  const byCode = typeof byCodeResult.payload === 'object' && byCodeResult.payload !== null && 'data' in byCodeResult.payload && Array.isArray(byCodeResult.payload.data)
    ? byCodeResult.payload.data[0] as ProdutoRecord | undefined
    : undefined

  return byCodeResult.ok && byCode?.id ? byCode : null
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json() as { tokens?: unknown[] }
  const tokens = Array.isArray(body.tokens)
    ? body.tokens.filter((token): token is string => typeof token === 'string' && token.trim().length > 0).map((token) => token.trim())
    : []

  const resolved: Array<{ token: string; id: string; label: string }> = []
  const missing: string[] = []

  for (const token of tokens) {
    const produto = await findProduto(token, session.token, session.currentTenantId)
    if (!produto?.id) {
      missing.push(token)
      continue
    }

    resolved.push({
      token,
      id: String(produto.id),
      label: `${String(produto.nome || produto.id)} - ${String(produto.id)}`,
    })
  }

  return NextResponse.json({ resolved, missing })
}
