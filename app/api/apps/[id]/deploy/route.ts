import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import { fetchAppById, getApiErrorMessage } from '@/app/api/apps/_apps-data'
import { triggerGithubRepositoryDispatch } from '@/app/api/apps/_apps-github'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await request.json() as { platform?: string }
    const platform = body.platform === 'ios' ? 'ios' : body.platform === 'android' ? 'android' : ''
    if (!platform) {
      return NextResponse.json({ message: 'Plataforma inválida.' }, { status: 400 })
    }

    const app = await fetchAppById(id, session.token, session.currentTenantId)
    const logResult = await serverApiFetch('apps/logs', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: {
        id_app: id,
        plataforma: platform,
        status: 'queued',
      },
    })

    if (!logResult.ok) {
      return NextResponse.json({ message: getApiErrorMessage(logResult.payload, 'Não foi possível registrar o log de publicação.') }, { status: logResult.status || 400 })
    }

    const logPayload = Array.isArray(logResult.payload) ? logResult.payload[0] : logResult.payload as Record<string, unknown>
    await triggerGithubRepositoryDispatch('deploy_client', {
      client_key: String(app.chave_cliente ?? ''),
      client_id_key: String(app.id_empresa ?? ''),
      platform,
      deploy_id: String(logPayload?.id ?? ''),
    })

    return NextResponse.json({ success: true, message: 'Aplicativo enviado para publicação.' })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível publicar o app.' }, { status: 500 })
  }
}
