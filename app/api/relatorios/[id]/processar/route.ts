import { NextResponse } from 'next/server'
import { buildDynamicProcessFields, extractApiErrorMessage, resolveRelatorioContext } from '@/app/api/relatorios/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resolved = await resolveRelatorioContext(id)
  if (resolved.error) {
    return resolved.error
  }

  const body = await request.json().catch(() => null) as { valores?: Record<string, string> } | null
  const valores = body?.valores ?? {}
  const campos = buildDynamicProcessFields(resolved.context.report.filtros, valores)
  const processoId = `${Date.now()}${Math.floor(Math.random() * 100000)}`

  const processoResult = await serverApiFetch('processos', {
    method: 'POST',
    token: resolved.context.session.token,
    tenantId: resolved.context.session.currentTenantId,
    body: {
      id: processoId,
      id_empresa: resolved.context.session.currentTenantId,
      id_usuario: resolved.context.session.currentUserId,
      id_relatorio: resolved.context.report.id,
      tipo: 'exportar_relatorio',
      status: 'criado',
    },
  })

  if (!processoResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(processoResult.payload, 'Não foi possível criar o processo do relatório.') },
      { status: processoResult.status || 400 },
    )
  }

  if (campos.length) {
    const camposResult = await serverApiFetch('processos/campos', {
      method: 'POST',
      token: resolved.context.session.token,
      tenantId: resolved.context.session.currentTenantId,
      body: campos.map((campo) => ({ ...campo, id_processo: processoId })),
    })

    if (!camposResult.ok) {
      return NextResponse.json(
        { message: extractApiErrorMessage(camposResult.payload, 'Não foi possível registrar os filtros do processo.') },
        { status: camposResult.status || 400 },
      )
    }
  }

  return NextResponse.json({ success: true, id: processoId })
}
