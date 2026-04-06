import { NextResponse } from 'next/server'
import { dicionarioApiFetch, getErrorMessage } from '@/app/api/dicionario-dados/_shared'

export async function GET() {
  const fetched = await dicionarioApiFetch('dicionarios_tabelas?embed=campos,componentes&perpage=1000&order=nome', {
    method: 'GET',
  })
  if ('error' in fetched) return fetched.error

  if (!fetched.result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(fetched.result.payload, 'Nao foi possivel carregar as tabelas do dicionario.') },
      { status: fetched.result.status || 400 },
    )
  }

  return NextResponse.json(fetched.result.payload)
}
