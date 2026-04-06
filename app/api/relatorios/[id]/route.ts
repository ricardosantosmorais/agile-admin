import { NextResponse } from 'next/server'
import { resolveRelatorioContext } from '@/app/api/relatorios/_shared'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resolved = await resolveRelatorioContext(id)
  if (resolved.error) {
    return resolved.error
  }

  return NextResponse.json(resolved.context.report)
}
