import { NextRequest, NextResponse } from 'next/server'
import { getPayloadMessage, requireSession, toStringValue } from '@/app/api/relatorios-master/_shared'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

export async function POST(request: NextRequest) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const sql = toStringValue(body.sql || body.query)
  const idEmpresa = toStringValue(body.id_empresa || body.idEmpresa)

  if (!idEmpresa) {
    return NextResponse.json({ message: 'Selecione uma empresa para executar a query.' }, { status: 400 })
  }
  if (!sql) {
    return NextResponse.json({ message: 'Informe a query antes de executar.' }, { status: 400 })
  }

  const result = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql', {
    method: 'POST',
    body: {
      id_empresa: idEmpresa,
      fonte_dados: toStringValue(body.fonte_dados || body.fonteDados || 'agileecommerce'),
      sql,
      id_usuario: '',
    },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel executar a query.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
