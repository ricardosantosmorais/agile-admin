import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { configuracoesInicioParameterKeys } from '@/src/features/configuracoes-inicio/services/configuracoes-inicio-mappers'
import {
  buildApiInQuery,
  buildLookupPath,
  buildCompanyParametersPath,
  extractParameterValues,
} from '@/src/lib/company-parameters-query'
import { serverApiFetch } from '@/src/services/http/server-api'

type InicioLookupResource = 'condicoes_pagamento' | 'filiais' | 'formas_pagamento' | 'tabelas_preco'

type InicioLookupConfig = {
  order: string
  fields: string[]
  matchQuery: (ids: string[]) => string
}

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

const inicioLookupConfig: Record<InicioLookupResource, InicioLookupConfig> = {
  condicoes_pagamento: {
    order: 'condicoes_pagamento.nome',
    fields: ['condicoes_pagamento.id', 'condicoes_pagamento.nome'],
    matchQuery: (ids) => buildApiInQuery('condicoes_pagamento.id', ids),
  },
  filiais: {
    order: 'filiais.nome_fantasia',
    fields: ['filiais.id', 'filiais.nome_fantasia'],
    matchQuery: (ids) => buildApiInQuery('filiais.id', ids),
  },
  formas_pagamento: {
    order: 'formas_pagamento.nome',
    fields: ['formas_pagamento.id', 'formas_pagamento.nome'],
    matchQuery: (ids) => buildApiInQuery('formas_pagamento.id', ids),
  },
  tabelas_preco: {
    order: 'tabelas_preco.nome',
    fields: ['tabelas_preco.id', 'tabelas_preco.nome'],
    matchQuery: (ids) => buildApiInQuery('tabelas_preco.id', ids),
  },
}

export async function GET() {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const parametersResult = await serverApiFetch(
    buildCompanyParametersPath(session.currentTenantId, configuracoesInicioParameterKeys),
    {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    },
  )

  if (!parametersResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(parametersResult.payload, 'Nao foi possivel carregar as configuracoes de inicio.') },
      { status: parametersResult.status || 400 },
    )
  }

  const branchIds = extractParameterValues(parametersResult.payload, ['id_filial_inicio'])
  const paymentMethodIds = extractParameterValues(parametersResult.payload, ['id_forma_pagamento_inicio'])
  const paymentConditionIds = extractParameterValues(parametersResult.payload, ['id_condicao_pagamento_inicio'])
  const priceTableIds = extractParameterValues(parametersResult.payload, ['id_tabela_preco_inicio'])

  const [paymentConditionsResult, branchesResult, paymentMethodsResult, priceTablesResult] = await Promise.all([
    loadLookupByIds(session, 'condicoes_pagamento', paymentConditionIds),
    loadLookupByIds(session, 'filiais', branchIds),
    loadLookupByIds(session, 'formas_pagamento', paymentMethodIds),
    loadLookupByIds(session, 'tabelas_preco', priceTableIds),
  ])

  for (const failed of [paymentConditionsResult, branchesResult, paymentMethodsResult, priceTablesResult]) {
    if (!failed.ok) {
      return NextResponse.json(
        { message: getErrorMessage(failed.payload, 'Nao foi possivel carregar os dados auxiliares da tela de inicio.') },
        { status: failed.status || 400 },
      )
    }
  }

  return NextResponse.json({
    parameters: parametersResult.payload,
    paymentConditions: paymentConditionsResult.payload,
    branches: branchesResult.payload,
    paymentMethods: paymentMethodsResult.payload,
    priceTables: priceTablesResult.payload,
  })
}

async function loadLookupByIds(
  session: NonNullable<Awaited<ReturnType<typeof readAuthSession>>>,
  resource: InicioLookupResource,
  ids: string[],
) {
  if (!ids.length) {
    return {
      ok: true,
      status: 200,
      payload: { data: [] },
    }
  }

  const config = inicioLookupConfig[resource]
  return serverApiFetch(
    buildLookupPath(resource, session.currentTenantId, {
      order: config.order,
      fields: config.fields,
      includeActiveOnly: false,
      extraParams: {
        q: config.matchQuery(ids),
      },
    }),
    {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    },
  )
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
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
      { message: getErrorMessage(result.payload, 'Nao foi possivel salvar as configuracoes de inicio.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}



