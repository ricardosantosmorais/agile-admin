import { NextRequest, NextResponse } from 'next/server'
import { handleCrudCollectionDelete, handleCrudCollectionGet } from '@/src/services/http/crud-route'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query'
import { serverApiFetch } from '@/src/services/http/server-api'

const config = { resource: 'vendedores' as const }

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function getParameterValue(payload: unknown, key: string) {
  const row = asArray(asRecord(payload).data).map(asRecord).find((item) => toStringValue(item.chave) === key)
  return toStringValue(asRecord(row).parametros)
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
    if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
      return payload.error.message
    }
  }

  return fallback
}

async function loadCurrentSellerAreaState(token: string, tenantId: string, id: string) {
  if (!id) {
    return false
  }

  const result = await serverApiFetch(`vendedores?id=${encodeURIComponent(id)}&perpage=1`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    return false
  }

  return isTruthy(asRecord(asArray(asRecord(result.payload).data)[0]).area_vendedor)
}

async function canActivateSellerArea(token: string, tenantId: string) {
  const parametersResult = await serverApiFetch(buildCompanyParametersPath(tenantId, ['area_representante', 'quantidade_cotas_vendedor']), {
    method: 'GET',
    token,
    tenantId,
  })

  if (!parametersResult.ok) {
    return {
      ok: false,
      response: NextResponse.json({ message: getErrorMessage(parametersResult.payload, 'Nao foi possivel validar as cotas da area do vendedor.') }, { status: parametersResult.status || 400 }),
    }
  }

  const activeArea = getParameterValue(parametersResult.payload, 'area_representante') === 'v2'
  const quota = Number(getParameterValue(parametersResult.payload, 'quantidade_cotas_vendedor') || 0)
  if (!activeArea || !Number.isFinite(quota) || quota <= 0) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Nao ha cotas disponiveis para ativar a area do vendedor.' }, { status: 400 }),
    }
  }

  const usedResult = await serverApiFetch('vendedores?area_vendedor=1&perpage=1', {
    method: 'GET',
    token,
    tenantId,
  })

  if (!usedResult.ok) {
    return {
      ok: false,
      response: NextResponse.json({ message: getErrorMessage(usedResult.payload, 'Nao foi possivel validar as cotas da area do vendedor.') }, { status: usedResult.status || 400 }),
    }
  }

  const used = Number(asRecord(asRecord(usedResult.payload).meta).total || 0)
  if (used >= quota) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Nao ha cotas disponiveis para ativar a area do vendedor.' }, { status: 400 }),
    }
  }

  return { ok: true as const }
}

export function GET(request: NextRequest) {
  return handleCrudCollectionGet(request, config)
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json()
  const payload = typeof body === 'object' && body !== null && !Array.isArray(body) ? asRecord(body) : {}
  const wantsSellerArea = isTruthy(payload.area_vendedor)

  if (wantsSellerArea) {
    const sellerAlreadyUsedArea = await loadCurrentSellerAreaState(session.token, session.currentTenantId, toStringValue(payload.id))
    if (!sellerAlreadyUsedArea) {
      const availability = await canActivateSellerArea(session.token, session.currentTenantId)
      if (!availability.ok) {
        return availability.response
      }
    }
  }

  const result = await serverApiFetch(config.resource, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: typeof body === 'object' && body !== null && !Array.isArray(body)
      ? {
          ...body,
          id_empresa: session.currentTenantId,
        }
      : body,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel salvar o registro.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}

export function DELETE(request: NextRequest) {
  return handleCrudCollectionDelete(request, config)
}
