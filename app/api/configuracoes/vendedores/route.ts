import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { configuracoesVendedoresParameterKeys } from '@/src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers'
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query'
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

  const result = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, configuracoesVendedoresParameterKeys), {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes de vendedores.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
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
      { message: getErrorMessage(result.payload, 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes de vendedores.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}



