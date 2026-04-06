import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

type PerfilPermissionNode = {
  id: string
  label: string
  description?: string
  children: PerfilPermissionNode[]
}

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
      ? payload.error.message
      : fallback
}

function parseIconClass(value: unknown) {
  const icon = asString(value).trim()
  if (!icon) {
    return ''
  }

  if (icon.includes('<i class="')) {
    const match = icon.match(/class="([^"]+)"/i)
    return match?.[1] ?? ''
  }

  return icon
}

function buildDescription(item: ApiRecord) {
  const icon = parseIconClass(item.icone)
  const parts = [asString(item.acao), icon].filter(Boolean)
  return parts.length ? parts.join(' • ') : undefined
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const idPerfil = request.nextUrl.searchParams.get('idPerfil')?.trim() || ''

  const funcionalidadesResult = await serverApiFetch(
    'funcionalidades?ativo=1&restrito=0&page=1&perpage=1000&order=nivel,posicao,nome&sort=asc,asc,asc&embed=empresas',
    {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    },
  )

  if (!funcionalidadesResult.ok) {
    return NextResponse.json({ message: getErrorMessage(funcionalidadesResult.payload, 'Nao foi possivel carregar as funcionalidades.') }, { status: funcionalidadesResult.status || 400 })
  }

  let selectedIds: string[] = []

  if (idPerfil) {
    const perfilResult = await serverApiFetch(`perfis?id_empresa=${encodeURIComponent(session.currentTenantId)}&id=${encodeURIComponent(idPerfil)}&embed=funcionalidades`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })

    if (!perfilResult.ok) {
      return NextResponse.json({ message: getErrorMessage(perfilResult.payload, 'Nao foi possivel carregar os acessos do perfil.') }, { status: perfilResult.status || 400 })
    }

    const perfilPayload = asRecord(perfilResult.payload)
    const perfil = asArray<ApiRecord>(perfilPayload.data)[0]
    selectedIds = asArray<ApiRecord>(asRecord(perfil).funcionalidades).map((item) => asString(item.id_funcionalidade)).filter(Boolean)
  }

  const tenantId = session.currentTenantId
  const funcionalidades = asArray<ApiRecord>(asRecord(funcionalidadesResult.payload).data).filter((item) => {
    const empresas = asArray<ApiRecord>(item.empresas)
    return !empresas.length || empresas.some((empresa) => asString(empresa.id) === tenantId)
  })

  const map = new Map<string, PerfilPermissionNode>()

  for (const funcionalidade of funcionalidades) {
    const id = asString(funcionalidade.id)
    map.set(id, {
      id,
      label: asString(funcionalidade.nome),
      description: buildDescription(funcionalidade),
      children: [],
    })
  }

  const roots: PerfilPermissionNode[] = []

  for (const funcionalidade of funcionalidades) {
    const id = asString(funcionalidade.id)
    const parentId = asString(funcionalidade.id_funcionalidade_pai)
    const node = map.get(id)

    if (!node) {
      continue
    }

    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node)
      continue
    }

    roots.push(node)
  }

  return NextResponse.json({
    nodes: roots,
    selectedIds: [...new Set(selectedIds)],
  })
}
