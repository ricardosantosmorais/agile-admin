import { NextRequest, NextResponse } from 'next/server'
import { fetchHttpClientCatalogItem, resolveHttpClientContext } from '@/app/api/http-client/_shared'

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolved = await resolveHttpClientContext()
  if (resolved.error) return resolved.error

  const { id } = await context.params
  if (!id?.trim()) {
    return NextResponse.json({ message: 'ID da requisicao invalido.' }, { status: 400 })
  }

  const fetched = await fetchHttpClientCatalogItem(id)
  if (!fetched.ok) {
    const payload = asRecord(fetched.payload)
    return NextResponse.json(
      { message: String(payload.message || 'Nao foi possivel carregar a requisicao.') },
      { status: fetched.status || 400 },
    )
  }

  return NextResponse.json({ data: fetched.payload })
}
