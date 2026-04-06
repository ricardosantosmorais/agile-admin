import { NextRequest, NextResponse } from 'next/server'
import { asRecord, dicionarioApiFetch, getErrorMessage } from '@/app/api/dicionario-dados/_shared'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const source = asRecord(body)

  const fetched = await dicionarioApiFetch('componentes_tabelas_campos_ignorados', {
    method: 'POST',
    body: {
      id_componente: source.idComponente || '',
      id_tabela: source.idTabela || '',
      id_dicionario_tabela_campo: source.idDicionarioTabelaCampo || '',
      id_usuario: source.idUsuario || '',
      observacao: source.observacao || '',
    },
  })

  if ('error' in fetched) return fetched.error
  if (!fetched.result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(fetched.result.payload, 'Nao foi possivel ignorar o campo.') },
      { status: fetched.result.status || 400 },
    )
  }

  return NextResponse.json(fetched.result.payload)
}
