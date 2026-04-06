import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { configuracoesPrecosParameterKeys } from '@/src/features/configuracoes-precos/services/configuracoes-precos-mappers'
import {
  buildApiInQuery,
  buildLookupPath,
  buildCompanyParametersPath,
  extractParameterValues,
} from '@/src/lib/company-parameters-query'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }

    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }
  }

  return fallback
}

export async function GET() {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'SessÃ£o expirada.' }, { status: 401 })
  }

  const parametersResult = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, configuracoesPrecosParameterKeys), {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!parametersResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(parametersResult.payload, 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes de preÃ§os.') },
      { status: parametersResult.status || 400 },
    )
  }

  const paymentMethodIds = extractParameterValues(parametersResult.payload, ['id_forma_pagamento_padrao'])
  const paymentConditionIds = extractParameterValues(parametersResult.payload, ['id_condicao_pagamento_padrao'])
  const priceTableIds = extractParameterValues(parametersResult.payload, [
    'id_tabela_preco_padrao',
    'id_tabela_preco_pf',
    'id_tabela_preco_pj',
  ])

  const [paymentMethodsResult, paymentConditionsResult, priceTablesResult] = await Promise.all([
    loadLookupByIds(session, 'formas_pagamento', paymentMethodIds, ['id', 'nome']),
    loadLookupByIds(session, 'condicoes_pagamento', paymentConditionIds, ['id', 'nome']),
    loadLookupByIds(session, 'tabelas_preco', priceTableIds, ['id', 'nome']),
  ])

  for (const failed of [paymentMethodsResult, paymentConditionsResult, priceTablesResult]) {
    if (!failed.ok) {
      return NextResponse.json(
        { message: getErrorMessage(failed.payload, 'NÃ£o foi possÃ­vel carregar os dados auxiliares de preÃ§os.') },
        { status: failed.status || 400 },
      )
    }
  }

  return NextResponse.json({
    parameters: parametersResult.payload,
    paymentMethods: paymentMethodsResult.payload,
    paymentConditions: paymentConditionsResult.payload,
    priceTables: priceTablesResult.payload,
  })
}

async function loadLookupByIds(
  session: NonNullable<Awaited<ReturnType<typeof readAuthSession>>>,
  resource: 'formas_pagamento' | 'condicoes_pagamento' | 'tabelas_preco',
  ids: string[],
  fields: string[],
) {
  if (!ids.length) {
    return {
      ok: true,
      status: 200,
      payload: { data: [] },
    }
  }

  return serverApiFetch(buildLookupPath(resource, session.currentTenantId, {
    order: 'nome',
    fields,
    includeActiveOnly: false,
    extraParams: {
      q: buildApiInQuery('id', ids),
    },
  }), {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'SessÃ£o expirada.' }, { status: 401 })
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

  if (!parameters.length) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const result = await serverApiFetch('empresas/parametros', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: parameters,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes de preÃ§os.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}



