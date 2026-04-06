import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
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

type Props = {
  params: Promise<{ id: string }>
}

async function loadFiliais(token: string, tenantId: string) {
  return serverApiFetch(`filiais?id_empresa=${tenantId}&perpage=1000&order=nome_fantasia`, {
    method: 'GET',
    token,
    tenantId,
  })
}

export async function GET(_: Request, { params }: Props) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const [filiaisResult, parametroResult] = await Promise.all([
    loadFiliais(session.token, session.currentTenantId),
    id === 'novo'
      ? Promise.resolve({ ok: true, payload: null, status: 200 })
      : serverApiFetch(`empresas/parametros?id_empresa=${session.currentTenantId}&id=${id}`, {
        method: 'GET',
        token: session.token,
        tenantId: session.currentTenantId,
      }),
  ])

  if (!filiaisResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(filiaisResult.payload, 'Não foi possível carregar o parâmetro.') },
      { status: filiaisResult.status || 400 },
    )
  }

  if (!parametroResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(parametroResult.payload, 'Não foi possível carregar o parâmetro.') },
      { status: parametroResult.status || 400 },
    )
  }

  const parametroPayload = parametroResult.payload && typeof parametroResult.payload === 'object'
    ? (Array.isArray((parametroResult.payload as { data?: unknown[] }).data)
      ? ((parametroResult.payload as { data?: unknown[] }).data?.[0] ?? null)
      : parametroResult.payload)
    : null

  return NextResponse.json({
    ...(parametroPayload && typeof parametroPayload === 'object' ? parametroPayload : {}),
    filiais: filiaisResult.payload,
  })
}

export async function POST(request: Request, { params }: Props) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as Record<string, string | boolean | null | undefined>

  const result = await serverApiFetch('empresas/parametros', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: {
      ...body,
      ...(id !== 'novo' ? { id } : {}),
    },
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível salvar o parâmetro.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}
