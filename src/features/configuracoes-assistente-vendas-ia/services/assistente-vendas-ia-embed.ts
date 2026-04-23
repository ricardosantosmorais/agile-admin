import { normalizeSearchValue } from '@/src/lib/text-normalization'

type AssistenteSession = {
  token: string
  currentTenantId: string
}

type AssistenteUserContext = {
  userId: string
  userEmail: string
}

export type AssistenteTokenPayload = {
  id_empresa?: string
  id_usuario: string
  email_usuario: string
  apiv3_token_usuario: string
  rota: string
}

export function buildAssistenteVendasIaPayload(
  session: AssistenteSession,
  user: AssistenteUserContext,
): AssistenteTokenPayload {
  const tenantId = String(session.currentTenantId || '').trim()
  const isRootTenant = normalizeSearchValue(tenantId) === 'agileecommerce'

  if (isRootTenant) {
    return {
      id_usuario: user.userId,
      email_usuario: user.userEmail,
      apiv3_token_usuario: session.token,
      rota: '/admin',
    }
  }

  return {
    id_empresa: tenantId,
    id_usuario: user.userId,
    email_usuario: user.userEmail,
    apiv3_token_usuario: session.token,
    rota: `/company/${tenantId}`,
  }
}
