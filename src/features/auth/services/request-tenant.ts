export const ACTIVE_TENANT_REQUEST_HEADER = 'X-Admin-V2-Tenant-Id'

type StoredTenantSession = {
  currentTenantId?: string | null
}

function normalizeTenantId(value: unknown) {
  return String(value ?? '').trim()
}

export function readActiveTabTenantId(request: Request) {
  return normalizeTenantId(request.headers.get(ACTIVE_TENANT_REQUEST_HEADER))
}

export function resolveRequestTenantId(
  request: Request,
  session: StoredTenantSession | null | undefined,
  explicitTenantId?: string | null,
) {
  return normalizeTenantId(explicitTenantId)
    || readActiveTabTenantId(request)
    || normalizeTenantId(session?.currentTenantId)
}
