import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

export type OccurrenceMode = 'restricoes' | 'excecoes'

type RouteContext = {
  params: Promise<{ id: string }>
}

const labels = {
  restricoes: {
    plural: 'restricoes',
    singular: 'restricao',
    editSynced: 'Nao e possivel editar uma restricao sincronizada.',
    deleteSynced: 'Nao e possivel excluir restricoes sincronizadas.',
    loadError: 'Nao foi possivel carregar as restricoes.',
    saveError: 'Nao foi possivel salvar a restricao.',
    deleteError: 'Nao foi possivel excluir as restricoes.',
  },
  excecoes: {
    plural: 'excecoes',
    singular: 'excecao',
    editSynced: 'Nao e possivel editar uma excecao sincronizada.',
    deleteSynced: 'Nao e possivel excluir excecoes sincronizadas.',
    loadError: 'Nao foi possivel carregar as excecoes.',
    saveError: 'Nao foi possivel salvar a excecao.',
    deleteError: 'Nao foi possivel excluir as excecoes.',
  },
} as const

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

function hasSyncedRecord(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
    return false
  }

  return payload.data.some((item) => {
    if (typeof item !== 'object' || item === null || !('id_sync' in item)) {
      return false
    }

    const syncId = item.id_sync
    return syncId !== undefined && syncId !== null && String(syncId).trim().length > 0
  })
}

async function assertEditableOccurrence(mode: OccurrenceMode, id: string, token: string, tenantId: string, message: string) {
  const result = await serverApiFetch(`condicoes_pagamento/${labels[mode].plural}?id_empresa=${tenantId}&id=${id}`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (result.ok && hasSyncedRecord(result.payload)) {
    return NextResponse.json({ message }, { status: 400 })
  }

  return null
}

export function createCondicaoPagamentoOccurrencesRoute(mode: OccurrenceMode) {
  return {
    async GET(_request: NextRequest, context: RouteContext) {
      const session = await readAuthSession()
      if (!session) {
        return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
      }

      const { id } = await context.params
      const result = await serverApiFetch(`condicoes_pagamento/${id}?embed=${labels[mode].plural}`, {
        method: 'GET',
        token: session.token,
        tenantId: session.currentTenantId,
      })

      if (!result.ok) {
        return NextResponse.json({ message: getErrorMessage(result.payload, labels[mode].loadError) }, { status: result.status || 400 })
      }

      const payload = result.payload as Record<string, unknown>
      const items = payload[labels[mode].plural]
      return NextResponse.json(Array.isArray(items) ? items : [])
    },

    async POST(request: NextRequest, context: RouteContext) {
      const session = await readAuthSession()
      if (!session) {
        return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
      }

      const { id } = await context.params
      const body = await request.json() as Record<string, unknown>
      if (typeof body.id === 'string' && body.id.trim().length > 0) {
        const syncedResponse = await assertEditableOccurrence(mode, body.id, session.token, session.currentTenantId, labels[mode].editSynced)
        if (syncedResponse) {
          return syncedResponse
        }
      }

      const result = await serverApiFetch(`condicoes_pagamento/${labels[mode].plural}`, {
        method: 'POST',
        token: session.token,
        tenantId: session.currentTenantId,
        body: {
          ...body,
          id_condicao_pagamento: id,
          id_empresa: session.currentTenantId,
          ativo: body.ativo === false || body.ativo === 0 || body.ativo === '0' ? false : true,
        },
      })

      if (!result.ok) {
        return NextResponse.json({ message: getErrorMessage(result.payload, labels[mode].saveError) }, { status: result.status || 400 })
      }

      return NextResponse.json(result.payload)
    },

    async DELETE(request: NextRequest, context: RouteContext) {
      const session = await readAuthSession()
      if (!session) {
        return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
      }

      const { id } = await context.params
      const body = await request.json() as { ids?: string[] }
      const ids = Array.isArray(body.ids) ? body.ids.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []

      for (const itemId of ids) {
        const syncedResponse = await assertEditableOccurrence(mode, itemId, session.token, session.currentTenantId, labels[mode].deleteSynced)
        if (syncedResponse) {
          return syncedResponse
        }
      }

      const result = await serverApiFetch(`condicoes_pagamento/${labels[mode].plural}`, {
        method: 'DELETE',
        token: session.token,
        tenantId: session.currentTenantId,
        body: ids.map((itemId) => ({ id_condicao_pagamento: id, id: itemId, id_empresa: session.currentTenantId })),
      })

      if (!result.ok) {
        return NextResponse.json({ message: getErrorMessage(result.payload, labels[mode].deleteError) }, { status: result.status || 400 })
      }

      return NextResponse.json({ success: true })
    },
  }
}
