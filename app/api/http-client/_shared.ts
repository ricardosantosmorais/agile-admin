import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server'
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { createDefaultHttpClientRequest, normalizeHttpClientDraft } from '@/src/features/http-client/services/http-client-mappers'
import type {
  HttpClientMethod,
  HttpClientRequestDraft,
} from '@/src/features/http-client/services/http-client-types'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'
import { serverApiFetch } from '@/src/services/http/server-api'

type HttpClientContext = {
  token: string
  tenantId: string
  tenantCodigo: string
  currentUserId: string
  clusterApi: string
  empresaHeader: string
  platformToken: string
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return fallback
}

function maskToken(token: string) {
  const normalized = token.trim()
  if (!normalized) return 'nao encontrado'
  if (normalized.length <= 8) return '*'.repeat(normalized.length)
  return `${normalized.slice(0, 4)}********${normalized.slice(-4)}`
}

function parseRoutes(content: string) {
  const lines = content.split(/\r?\n/)
  const seen = new Set<string>()
  const items: Array<{ method: HttpClientMethod; path: string; label: string }> = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line.includes('Route::')) continue

    const routeDirect = line.match(/Route::(get|post|put|patch|delete|options|head)\s*\(\s*['"]([^'"]+)['"]/i)
    if (routeDirect) {
      const method = routeDirect[1].toUpperCase() as HttpClientMethod
      let routePath = routeDirect[2].trim()
      if (!routePath) continue
      if (!routePath.startsWith('/')) routePath = `/${routePath}`
      const key = `${method} ${routePath}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ method, path: routePath, label: key })
      continue
    }

    const routeMatch = line.match(/Route::match\s*\(\s*\[(.*?)\]\s*,\s*['"]([^'"]+)['"]/i)
    if (!routeMatch) continue

    let routePath = routeMatch[2].trim()
    if (!routePath) continue
    if (!routePath.startsWith('/')) routePath = `/${routePath}`

    const methods = [...routeMatch[1].matchAll(/['"](get|post|put|patch|delete|options|head)['"]/gi)].map((m) => m[1].toUpperCase() as HttpClientMethod)
    const normalizedMethods: HttpClientMethod[] = methods.length ? methods : ['GET']
    for (const method of normalizedMethods) {
      const key = `${method} ${routePath}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ method, path: routePath, label: key })
    }
  }

  items.sort((left, right) => {
    if (left.path === right.path) return left.method.localeCompare(right.method)
    return left.path.localeCompare(right.path)
  })

  return items
}

async function resolveRoutesFile() {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, '..', 'api-v3', 'routes', 'api.php'),
    path.join(cwd, '..', 'admin', 'api-v3', 'routes', 'api.php'),
    path.join(cwd, '..', 'admin', 'api', 'routes', 'api.php'),
    'C:\\Projetos\\api-v3\\routes\\api.php',
    'C:\\Projetos\\admin\\api-v3\\routes\\api.php',
    'C:\\Projetos\\admin\\api\\routes\\api.php',
  ]

  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      continue
    }
  }

  return ''
}

export async function loadEndpointCatalog() {
  const routesFile = await resolveRoutesFile()
  if (!routesFile) return []

  try {
    const content = await readFile(routesFile, 'utf-8')
    return parseRoutes(content)
  } catch {
    return []
  }
}

export async function resolveHttpClientContext() {
  const storedSession = await readAuthSession()
  if (!storedSession?.token || !storedSession.currentTenantId) {
    return {
      error: NextResponse.json({ message: 'Sessao nao encontrada.' }, { status: 401 }),
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
        { message: extractApiErrorMessage(validated.payload, 'Sessao invalida.') },
        { status: 401 },
      ),
    }
  }

  const enrichedPayload = await enrichMasterPayload(validated.payload, storedSession.token, storedSession.currentTenantId)
  const session = mapAuthSession(enrichedPayload)
  const tenantCodigo = session.currentTenant.codigo || session.currentTenant.id
  if (!tenantCodigo) {
    return {
      error: NextResponse.json({ message: 'Empresa ativa sem codigo de integracao.' }, { status: 409 }),
    }
  }

  const platformTokenResponse = await serverApiFetch(
    `empresas/parametros?id_empresa=${encodeURIComponent(storedSession.currentTenantId)}&chave=agileecommerce_api_token_empresa&order=chave,posicao&perpage=1`,
    {
      method: 'GET',
      token: storedSession.token,
      tenantId: storedSession.currentTenantId,
    },
  )

  const platformTokenPayload = asRecord(platformTokenResponse.payload)
  const platformTokenData = Array.isArray(platformTokenPayload.data) ? platformTokenPayload.data : []
  const platformToken = asString(asRecord(platformTokenData[0]).parametros).trim()

  return {
    context: {
      token: storedSession.token,
      tenantId: storedSession.currentTenantId,
      tenantCodigo,
      currentUserId: storedSession.currentUserId,
      clusterApi: session.currentTenant.clusterApi || '',
      empresaHeader: storedSession.currentTenantId,
      platformToken,
    } satisfies HttpClientContext,
  }
}

function extractRows(payload: unknown) {
  const response = asRecord(payload)
  return Array.isArray(response.data) ? response.data : []
}

export async function listHttpClientCatalog(context: HttpClientContext) {
  const byTenant = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql_consultas', {
    method: 'GET',
    query: {
      perpage: 5000,
      id_empresa: context.tenantCodigo,
    },
  })

  const byTenantRows = extractRows(byTenant.payload)
  if (byTenantRows.length) return byTenantRows

  const fallback = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql_consultas', {
    method: 'GET',
    query: { perpage: 5000 },
  })
  return extractRows(fallback.payload)
}

export function mapHttpClientCatalogRows(rows: unknown[]) {
  return rows
    .map((row) => {
      const source = asRecord(row)
      const rawSql = asString(source.sql || source.sql_consulta)
      const snapshot = asRecord((() => {
        try {
          return rawSql ? JSON.parse(rawSql) : {}
        } catch {
          return {}
        }
      })())
      const meta = asRecord(snapshot._meta)
      const fonteDados = asString(source.fonte_dados).toLowerCase()
      const isHttpClient = fonteDados === 'http_client' || asString(meta.catalog_type) === 'http_client'
      if (!isHttpClient) return null
      const id = asString(source.id)
      if (!id) return null

      return {
        id,
        nome: asString(source.nome_consulta || source.nome),
        descricao: asString(source.descricao_consulta || source.descricao).trim(),
        publico: toBoolean(source.publico, true),
        usuario: asString(source.nome_usuario),
        dthr: asString(source.dthr || source.created_at),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => Number(right.id || 0) - Number(left.id || 0))
}

export async function fetchHttpClientCatalogItem(id: string) {
  const result = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql_consultas', {
    method: 'GET',
    query: { id },
  })
  if (!result.ok) return { ok: false, payload: result.payload, status: result.status }

  const rows = extractRows(result.payload)
  const source = asRecord(rows[0])
  if (!Object.keys(source).length) {
    return { ok: false, payload: { message: 'Requisicao nao encontrada no catalogo.' }, status: 404 }
  }

  const rawSql = asString(source.sql || source.sql_consulta)
  let requestSnapshot: HttpClientRequestDraft = createDefaultHttpClientRequest()
  try {
    requestSnapshot = normalizeHttpClientDraft(JSON.parse(rawSql))
  } catch {
    requestSnapshot = createDefaultHttpClientRequest()
  }

  const meta = asRecord(asRecord(requestSnapshot)._meta)
  const fonteDados = asString(source.fonte_dados).toLowerCase()
  const isHttpClient = fonteDados === 'http_client' || asString(meta.catalog_type) === 'http_client'
  if (!isHttpClient) {
    return { ok: false, payload: { message: 'Item selecionado nao e um catalogo de HTTP Client.' }, status: 409 }
  }

  return {
    ok: true,
    payload: {
      id: asString(source.id),
      nome: asString(source.nome_consulta || source.nome),
      descricao: asString(source.descricao_consulta || source.descricao).trim(),
      publico: toBoolean(source.publico, true),
      request: requestSnapshot,
    },
    status: 200,
  }
}

export async function saveHttpClientCatalogItem(context: HttpClientContext, input: {
  id?: string
  nome: string
  descricao: string
  publico: boolean
  request: HttpClientRequestDraft
}) {
  const payload = {
    id_empresa: context.tenantCodigo,
    id: input.id || '',
    fonte_dados: 'http_client',
    nome: input.nome,
    descricao: input.descricao,
    publico: input.publico ? 1 : 0,
    id_usuario: context.currentUserId,
    sql: JSON.stringify({
      ...input.request,
      _meta: {
        catalog_type: 'http_client',
        saved_at: new Date().toISOString(),
      },
    }),
  }

  const result = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql_consultas', {
    method: 'POST',
    body: payload,
  })

  if (!result.ok) {
    return { ok: false, payload: result.payload, status: result.status }
  }

  const responseRecord = asRecord(result.payload)
  const responseData = asRecord(responseRecord.data)
  const responseDataFirst = asRecord(Array.isArray(responseRecord.data) ? responseRecord.data[0] : null)
  const id = asString(responseRecord.id || responseData.id || responseDataFirst.id || input.id)

  return {
    ok: true,
    payload: {
      message: 'Requisicao salva com sucesso.',
      data: { id },
    },
    status: 200,
  }
}

export function maskRequestHeaders(headers: Headers) {
  const response: Record<string, string> = {}
  headers.forEach((value, key) => {
    if (key.toLowerCase() === 'authorization') {
      if (value.toLowerCase().startsWith('bearer ')) {
        response[key] = `Bearer ${maskToken(value.slice(7))}`
      } else if (value.toLowerCase().startsWith('basic ')) {
        response[key] = 'Basic ********'
      } else {
        response[key] = '********'
      }
      return
    }
    response[key] = value
  })

  return response
}
