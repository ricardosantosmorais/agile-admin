import { NextResponse } from 'next/server'
import {
  generateSecret,
  getErrorMessage,
  painelB2BFetch,
  resolveIntegracaoAplicativosContext,
} from '@/app/api/integracao-aplicativos/_shared'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const { id } = await context.params
  const result = await painelB2BFetch('gestao_usuario', {
    method: 'POST',
    body: {
      id,
      id_empresa: resolved.context.tenantCodigo,
      id_perfil: 4,
      perfil: 'api',
      senha: generateSecret(),
    },
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível renovar o secret do aplicativo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}

