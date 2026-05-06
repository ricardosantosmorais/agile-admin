import { NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'
import { serverApiFetch } from '@/src/services/http/server-api'

type ResolvedSqlEditorContext = {
  token: string
  tenantId: string
  tenantCodigo: string
  currentUserId: string
  useAgileSyncForErp: boolean
}

export async function resolveSqlEditorContext() {
  const storedSession = await readAuthSession()

  if (!storedSession?.token || !storedSession.currentTenantId) {
    return {
      error: NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 }),
    }
  }

  const validated = await serverApiFetch('login/validar', {
    method: 'POST',
    token: storedSession.token,
    tenantId: storedSession.currentTenantId,
  })

  if (!validated.ok) {
    return {
      error: NextResponse.json(
        { message: extractApiErrorMessage(validated.payload, 'Sessão inválida.') },
        { status: 401 },
      ),
    }
  }

  const enrichedPayload = await enrichMasterPayload(validated.payload, storedSession.token, storedSession.currentTenantId)
  const session = mapAuthSession(enrichedPayload)
  const tenantCodigo = session.currentTenant.codigo || session.currentTenant.id

  if (!tenantCodigo) {
    return {
      error: NextResponse.json(
        { message: 'Empresa ativa sem código de integração configurado.' },
        { status: 409 },
      ),
    }
  }

  return {
    context: {
      token: storedSession.token,
      tenantId: storedSession.currentTenantId,
      tenantCodigo,
      currentUserId: storedSession.currentUserId,
      useAgileSyncForErp: false,
    } satisfies ResolvedSqlEditorContext,
  }
}

export async function executeSqlAgainstExternalApi(
  context: ResolvedSqlEditorContext,
  requestBody: {
    idEmpresa?: string
    fonteDados: string
    sql: string
    page: number
    perPage: number
  },
) {
  return externalAdminApiFetch('painelb2b', 'agilesync_editorsql', {
    method: 'POST',
    body: {
      id_empresa: requestBody.idEmpresa || context.tenantCodigo,
      fonte_dados: requestBody.fonteDados,
      sql: requestBody.sql,
      id_usuario: '',
      page: requestBody.page,
      perpage: requestBody.perPage,
      limit: requestBody.perPage,
      offset: Math.max(0, (requestBody.page - 1) * requestBody.perPage),
      start: Math.max(0, (requestBody.page - 1) * requestBody.perPage),
      length: requestBody.perPage,
      include_total: 1,
    },
  })
}
