import { NextResponse } from 'next/server'
import {
  asArray,
  asRecord,
  getErrorMessage,
  painelB2BFetch,
  resolveIntegracaoAplicativosContext,
} from '@/app/api/integracao-aplicativos/_shared'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const { id } = await context.params
  const result = await painelB2BFetch('gestao_usuario', {
    method: 'GET',
    query: {
      id,
      perpage: 1,
      id_empresa: resolved.context.tenantCodigo,
      id_perfil: 4,
    },
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar o aplicativo.') },
      { status: result.status || 400 },
    )
  }

  const item = asRecord(asArray(asRecord(result.payload).data)[0])
  if (!Object.keys(item).length) {
    return NextResponse.json({ message: 'Aplicativo não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(item)
}

