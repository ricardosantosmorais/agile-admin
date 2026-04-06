import { NextRequest, NextResponse } from 'next/server'
import { asRecord, dicionarioApiFetch, getErrorMessage } from '@/app/api/dicionario-dados/_shared'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const source = asRecord(body)

  const fetched = await dicionarioApiFetch('componentes_tabelas_campos_ignorados', {
    method: 'DELETE',
    body: [
      {
        id,
        id_componente: source.idComponente || '',
        id_dicionario_tabela_campo: source.idDicionarioTabelaCampo || '',
      },
    ],
  })

  if ('error' in fetched) return fetched.error
  if (!fetched.result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(fetched.result.payload, 'Nao foi possivel remover o status de ignorado.') },
      { status: fetched.result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}
