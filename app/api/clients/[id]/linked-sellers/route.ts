import { NextRequest, NextResponse } from 'next/server'
import type { ClientLinkedSellerListItem } from '@/src/features/clientes/types/clientes'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function mapLinkedSellers(payload: unknown): ClientLinkedSellerListItem[] {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return []
  }

  return payload.data.map((item) => {
    const row = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
    const vendedor = typeof row.vendedor === 'object' && row.vendedor !== null ? row.vendedor as Record<string, unknown> : {}

    return {
      idCliente: typeof row.id_cliente === 'string' ? row.id_cliente : '',
      idVendedor: typeof row.id_vendedor === 'string' ? row.id_vendedor : '',
      codigo: typeof vendedor.codigo === 'string' ? vendedor.codigo : '',
      nome: typeof vendedor.nome === 'string' ? vendedor.nome : '',
      email: typeof vendedor.email === 'string' ? vendedor.email : '',
      telefone: typeof vendedor.telefone === 'string' ? vendedor.telefone : '',
      celular: typeof vendedor.celular === 'string' ? vendedor.celular : '',
    }
  })
}

function getMessage(payload: unknown, fallback: string) {
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`clientes_vendedores?id_cliente=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getMessage(result.payload, 'Nao foi possivel carregar os vendedores vinculados.') }, { status: result.status || 400 })
  }

  return NextResponse.json(mapLinkedSellers(result.payload))
}
