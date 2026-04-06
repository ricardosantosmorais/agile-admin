import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { configuracoesEntregasParameterKeys } from '@/src/features/configuracoes-entregas/services/configuracoes-entregas-mappers'
import {
  buildApiInQuery,
  buildLookupPath,
  buildCompanyParametersPath,
  extractParameterValues,
} from '@/src/lib/company-parameters-query'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

export async function GET() {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'SessÃƒÂ£o expirada.' }, { status: 401 })
  }

  const parametersResult = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, configuracoesEntregasParameterKeys), {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!parametersResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(parametersResult.payload, 'NÃƒÂ£o foi possÃƒÂ­vel carregar as configuraÃƒÂ§ÃƒÂµes de entregas.') },
      { status: parametersResult.status || 400 },
    )
  }

  const deliveryMethodIds = extractParameterValues(parametersResult.payload, ['id_forma_entrega_padrao'])

  const deliveryMethodsResult = !deliveryMethodIds.length
    ? { ok: true, status: 200, payload: { data: [] } }
    : await serverApiFetch(buildLookupPath('formas_entrega', session.currentTenantId, {
      order: 'formas_entrega.nome',
      fields: ['formas_entrega.id', 'formas_entrega.nome'],
      includeActiveOnly: false,
      extraParams: {
        q: buildApiInQuery('formas_entrega.id', deliveryMethodIds),
      },
    }), {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })

  if (!deliveryMethodsResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(deliveryMethodsResult.payload, 'NÃƒÂ£o foi possÃƒÂ­vel carregar as formas de entrega.') },
      { status: deliveryMethodsResult.status || 400 },
    )
  }

  return NextResponse.json({
    parameters: parametersResult.payload,
    deliveryMethods: deliveryMethodsResult.payload,
  })
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'SessÃƒÂ£o expirada.' }, { status: 401 })
  }

  const body = (await request.json()) as {
    parameters?: Array<{ id_filial?: string | null; chave?: string; parametros?: string }>
  }

  const parameters = Array.isArray(body.parameters)
    ? body.parameters
      .filter((parameter) => typeof parameter?.chave === 'string' && parameter.chave.trim().length > 0)
      .map((parameter) => ({
        id_filial: parameter.id_filial ?? null,
        chave: String(parameter.chave).trim(),
        parametros: String(parameter.parametros ?? '').trim(),
      }))
    : []

  const result = await serverApiFetch('empresas/parametros', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: parameters,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'NÃƒÂ£o foi possÃƒÂ­vel salvar as configuraÃƒÂ§ÃƒÂµes de entregas.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}



