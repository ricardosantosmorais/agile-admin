import { NextRequest, NextResponse } from 'next/server'
import {
  asArray,
  asBoolean,
  asRecord,
  asString,
  getErrorMessage,
  painelB2BFetch,
  resolveIntegracaoAplicativosContext,
} from '@/app/api/integracao-aplicativos/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const { id } = await context.params
  const [usuarioResult, tabelasResult, acessosResult] = await Promise.all([
    painelB2BFetch('gestao_usuario', {
      method: 'GET',
      query: {
        id,
        perpage: 1,
        id_empresa: resolved.context.tenantCodigo,
        id_perfil: 4,
      },
    }),
    serverApiFetch('dicionarios_tabelas?perpage=1000&order=nome&integra=1', {
      method: 'GET',
      token: resolved.context.token,
      tenantId: resolved.context.tenantId,
    }),
    painelB2BFetch('gestao_usuario_acesso', {
      method: 'GET',
      query: {
        id_usuario: id,
        perpage: 1000,
        id_empresa: resolved.context.tenantCodigo,
      },
    }),
  ])

  if (!usuarioResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(usuarioResult.payload, 'Não foi possível carregar o aplicativo.') },
      { status: usuarioResult.status || 400 },
    )
  }

  if (!tabelasResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(tabelasResult.payload, 'Não foi possível carregar as tabelas de integração.') },
      { status: tabelasResult.status || 400 },
    )
  }

  if (!acessosResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(acessosResult.payload, 'Não foi possível carregar as permissões do aplicativo.') },
      { status: acessosResult.status || 400 },
    )
  }

  const usuario = asRecord(asArray(asRecord(usuarioResult.payload).data)[0])
  if (!Object.keys(usuario).length) {
    return NextResponse.json({ message: 'Aplicativo não encontrado.' }, { status: 404 })
  }

  const permissionsByTable = new Map<string, Record<string, unknown>>(
    asArray<Record<string, unknown>>(asRecord(acessosResult.payload).data)
      .map((item) => [asString(item.tabela_nome), item]),
  )

  const rows = asArray<Record<string, unknown>>(asRecord(tabelasResult.payload).data)
    .map((item) => {
      const tabelaNome = asString(item.nome)
      const permission = permissionsByTable.get(tabelaNome)
      return {
        tabelaNome,
        verboGet: asBoolean(permission?.verbo_get),
        verboPost: asBoolean(permission?.verbo_post),
        verboPut: asBoolean(permission?.verbo_put),
        verboDelete: asBoolean(permission?.verbo_delete),
      }
    })

  return NextResponse.json({
    usuario: {
      id: asString(usuario.id),
      nome: asString(usuario.nome),
      email: asString(usuario.email),
    },
    rows,
  })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const source = asRecord(body)

  const rows = Array.isArray(source.rows)
    ? source.rows
        .map((item) => asRecord(item))
        .filter((item) => asString(item.tabelaNome).trim().length > 0)
        .map((item) => ({
          id_usuario: id,
          tabela_nome: asString(item.tabelaNome).trim(),
          verbo_get: asBoolean(item.verboGet) ? 1 : 0,
          verbo_post: asBoolean(item.verboPost) ? 1 : 0,
          verbo_put: asBoolean(item.verboPut) ? 1 : 0,
          verbo_delete: asBoolean(item.verboDelete) ? 1 : 0,
        }))
    : []

  const result = await painelB2BFetch('gestao_usuario_acesso', {
    method: 'POST',
    body: rows,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível salvar as permissões do aplicativo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({ success: true })
}
