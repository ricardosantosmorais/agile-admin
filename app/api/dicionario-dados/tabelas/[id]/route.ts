import { NextRequest, NextResponse } from 'next/server'
import { asRecord, dicionarioApiFetch, getErrorMessage } from '@/app/api/dicionario-dados/_shared'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const fetched = await dicionarioApiFetch(`dicionarios_tabelas?id=${encodeURIComponent(id)}&embed=campos,componentes.componente&perpage=1`, {
    method: 'GET',
  })
  if ('error' in fetched) return fetched.error

  if (!fetched.result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(fetched.result.payload, 'Nao foi possivel carregar o detalhe da tabela.') },
      { status: fetched.result.status || 400 },
    )
  }

  return NextResponse.json(fetched.result.payload)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const source = asRecord(body)

  const fetched = await dicionarioApiFetch('dicionarios_tabelas', {
    method: 'POST',
    body: {
      id,
      descricao: source.descricao || '',
      regra: source.regra || '',
    },
  })
  if ('error' in fetched) return fetched.error

  if (!fetched.result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(fetched.result.payload, 'Nao foi possivel salvar a tabela do dicionario.') },
      { status: fetched.result.status || 400 },
    )
  }

  return NextResponse.json(fetched.result.payload)
}
