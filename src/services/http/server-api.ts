type ServerApiOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  token?: string
  tenantId?: string
  body?: unknown
}

const API_V3_BASE_URL = (
  process.env.ADMIN_URL_API_V3
  || process.env.NEXT_PUBLIC_API_V3_URL
  || 'http://localhost:9001/'
).replace(/\/+$/, '')

export async function serverApiFetch(path: string, options: ServerApiOptions = {}) {
  const response = await fetch(`${API_V3_BASE_URL}/${path.replace(/^\/+/, '')}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Perfil: 'administrador',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.tenantId ? { Empresa: options.tenantId, 'X-Id-Empresa': options.tenantId } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  return {
    ok: response.ok,
    status: response.status,
    payload,
  }
}
