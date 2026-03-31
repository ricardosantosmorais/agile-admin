import { NextRequest, NextResponse } from 'next/server'
import {
  executeSqlAgainstExternalApi,
  resolveSqlEditorContext,
} from '@/app/api/editor-sql/_shared'
import {
  buildSqlQueryPagination,
  normalizeSqlQueryRows,
} from '@/src/features/editor-sql/services/sql-editor-mappers'

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

export async function POST(request: NextRequest) {
  const resolved = await resolveSqlEditorContext()
  if (resolved.error) {
    return resolved.error
  }

  const body = await request.json().catch(() => null) as {
    fonteDados?: string
    sql?: string
    page?: number
    perPage?: number
  } | null

  const sql = String(body?.sql || '').trim()
  const fonteDados = String(body?.fonteDados || 'agileecommerce').trim()
  const page = Math.max(1, Number(body?.page || 1))
  const perPage = Math.min(1000, Math.max(1, Number(body?.perPage || 100)))

  if (!sql) {
    return NextResponse.json(
      { message: 'Informe a consulta SQL antes de executar.' },
      { status: 400 },
    )
  }

  const executed = await executeSqlAgainstExternalApi(resolved.context, {
    fonteDados,
    sql,
    page,
    perPage,
  })

  if (!executed.ok) {
    return NextResponse.json(
      { message: getErrorMessage(executed.payload, 'Não foi possível executar a consulta SQL.') },
      { status: executed.status || 400 },
    )
  }

  const rows = normalizeSqlQueryRows(executed.payload)

  return NextResponse.json({
    raw: executed.payload,
    rows,
    pagination: buildSqlQueryPagination(executed.payload, page, perPage, rows),
  })
}
