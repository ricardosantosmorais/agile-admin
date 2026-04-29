import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { fetchAppById } from '@/app/api/apps/_apps-data'
import { triggerGithubWorkflowDispatch } from '@/app/api/apps/_apps-github'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await request.json() as { email?: string }
    const email = String(body.email ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'E-mail inválido.' }, { status: 400 })
    }

    const app = await fetchAppById(id, session.token, session.currentTenantId)
    await triggerGithubWorkflowDispatch('send_build_email.yml', {
      client_filter: String(app.chave_cliente ?? ''),
      client_id_filter: String(app.id_empresa ?? ''),
      email_to: email,
    })

    return NextResponse.json({ success: true, message: 'Solicitação enviada ao GitHub. O e-mail chegará em breve.' })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível solicitar o build.' }, { status: 500 })
  }
}
