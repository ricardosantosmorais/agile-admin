import { NextRequest, NextResponse } from 'next/server'
import {
  listHttpClientCatalog,
  mapHttpClientCatalogRows,
  resolveHttpClientContext,
  saveHttpClientCatalogItem,
} from '@/app/api/http-client/_shared'
import { normalizeHttpClientDraft } from '@/src/features/http-client/services/http-client-mappers'

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export async function GET() {
  const resolved = await resolveHttpClientContext()
  if (resolved.error) return resolved.error

  const rows = await listHttpClientCatalog(resolved.context)
  return NextResponse.json({
    data: mapHttpClientCatalogRows(rows),
  })
}

export async function POST(request: NextRequest) {
  const resolved = await resolveHttpClientContext()
  if (resolved.error) return resolved.error

  const body = await request.json().catch(() => null)
  const source = asRecord(body)
  const nome = String(source.nome || '').trim()
  if (!nome) {
    return NextResponse.json({ message: 'Informe o nome da requisicao.' }, { status: 400 })
  }

  const saved = await saveHttpClientCatalogItem(resolved.context, {
    id: String(source.id || '').trim() || undefined,
    nome,
    descricao: String(source.descricao || '').trim(),
    publico: source.publico !== false,
    request: normalizeHttpClientDraft(source.request),
  })

  if (!saved.ok) {
    const payload = asRecord(saved.payload)
    return NextResponse.json(
      { message: String(payload.message || 'Nao foi possivel salvar a requisicao.') },
      { status: saved.status || 400 },
    )
  }

  return NextResponse.json(saved.payload)
}
