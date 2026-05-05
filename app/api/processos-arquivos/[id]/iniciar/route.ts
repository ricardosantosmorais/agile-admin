import { NextResponse } from 'next/server'
import { ensureProcessHasMappings, getProcessoArquivoErrorMessage } from '@/app/api/processos-arquivos/_execution-guard'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const mappingError = await ensureProcessHasMappings({
    id,
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (mappingError) {
    return mappingError
  }

  const result = await serverApiFetch('processos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: [{ id, status: 'criado' }],
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getProcessoArquivoErrorMessage(result.payload, 'Não foi possível iniciar o processo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}
