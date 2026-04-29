import { NextRequest, NextResponse } from 'next/server'
import { getPayloadMessage, requireSession, toStringValue } from '@/app/api/relatorios-master/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const sessionOrResponse = await requireSession()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const { id } = await context.params
  const idQuery = toStringValue(request.nextUrl.searchParams.get('id_query') || request.nextUrl.searchParams.get('idQuery'))
  const result = await externalAdminApiFetch('painelb2b', 'query_campos', {
    method: 'GET',
    query: { id, ...(idQuery ? { id_query: idQuery } : {}), perpage: 1 },
  })

  if (!result.ok) {
    return NextResponse.json({ message: getPayloadMessage(result.payload, 'Nao foi possivel carregar o campo.') }, { status: result.status || 400 })
  }

  const item = asArray<Record<string, unknown>>(asRecord(result.payload).data).at(0)
  if (!item) return NextResponse.json({ message: 'Campo nao encontrado.' }, { status: 404 })
  return NextResponse.json(item)
}
