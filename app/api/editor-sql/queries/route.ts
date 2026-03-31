import { NextRequest, NextResponse } from 'next/server'
import { resolveSqlEditorContext } from '@/app/api/editor-sql/_shared'
import { mapSavedSqlQuery } from '@/src/features/editor-sql/services/sql-editor-mappers'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
  return String(value ?? '').trim()
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

export async function GET() {
  const resolved = await resolveSqlEditorContext()
  if (resolved.error) {
    return resolved.error
  }

  const loaded = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql_consultas', {
    method: 'GET',
    query: {
      perpage: 5000,
    },
  })

  if (!loaded.ok) {
    return NextResponse.json(
      { message: getErrorMessage(loaded.payload, 'Não foi possível carregar as consultas salvas.') },
      { status: loaded.status || 400 },
    )
  }

  const source = asRecord(loaded.payload)
  const rows = Array.isArray(source.data) ? source.data.map(mapSavedSqlQuery).filter((item) => item.id) : []

  return NextResponse.json({ data: rows })
}

export async function POST(request: NextRequest) {
  const resolved = await resolveSqlEditorContext()
  if (resolved.error) {
    return resolved.error
  }

  const body = await request.json().catch(() => null) as {
    id?: string
    nome?: string
    descricao?: string
    publico?: boolean
    fonteDados?: string
    sql?: string
  } | null

  const nome = asString(body?.nome)
  const sql = asString(body?.sql)

  if (!nome || !sql) {
    return NextResponse.json(
      { message: 'Nome e consulta SQL são obrigatórios para salvar.' },
      { status: 400 },
    )
  }

  const saved = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql_consultas', {
    method: 'POST',
    body: {
      id_empresa: resolved.context.tenantCodigo,
      id: asString(body?.id),
      nome,
      descricao: asString(body?.descricao),
      publico: body?.publico ? 1 : 0,
      fonte_dados: asString(body?.fonteDados || 'agileecommerce'),
      sql,
      id_usuario: resolved.context.currentUserId,
    },
  })

  if (!saved.ok) {
    return NextResponse.json(
      { message: getErrorMessage(saved.payload, 'Não foi possível salvar a consulta.') },
      { status: saved.status || 400 },
    )
  }

  const source = asRecord(saved.payload)
  const data = asRecord(source.data)

  return NextResponse.json({
    message: getErrorMessage(saved.payload, 'Consulta salva com sucesso.'),
    data: {
      id: asString(data.id || body?.id),
    },
  })
}
