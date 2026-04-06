import { NextResponse } from 'next/server'
import { loadEndpointCatalog, resolveHttpClientContext } from '@/app/api/http-client/_shared'

export async function GET() {
  const resolved = await resolveHttpClientContext()
  if (resolved.error) return resolved.error

  const endpointCatalog = await loadEndpointCatalog()
  const tokenMasked = resolved.context.platformToken
    ? `${resolved.context.platformToken.slice(0, 4)}********${resolved.context.platformToken.slice(-4)}`
    : 'nao encontrado'

  return NextResponse.json({
    baseUrl: resolved.context.clusterApi || '',
    empresaHeader: resolved.context.empresaHeader || '',
    tokenMasked,
    authorizationMasked: `Bearer ${tokenMasked}`,
    endpointCatalog,
  })
}
