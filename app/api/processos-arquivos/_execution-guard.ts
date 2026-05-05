import { NextResponse } from 'next/server'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function getProcessoArquivoErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

export async function ensureProcessHasMappings(input: {
  id: string
  token: string
  tenantId: string
}) {
  const query = new URLSearchParams({
    id_empresa: input.tenantId,
    id: input.id,
    tipo: 'importacao_planilha',
    embed: 'mapeamentos',
    perpage: '1',
  })

  const result = await serverApiFetch(`processos?${query.toString()}`, {
    method: 'GET',
    token: input.token,
    tenantId: input.tenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getProcessoArquivoErrorMessage(result.payload, 'Não foi possível validar os mapeamentos do processo.') },
      { status: result.status || 400 },
    )
  }

  const process = asArray(asRecord(result.payload).data)[0]
  if (!process || typeof process !== 'object') {
    return NextResponse.json({ message: 'Processo não encontrado.' }, { status: 404 })
  }

  if (asArray(asRecord(process).mapeamentos).length === 0) {
    return NextResponse.json(
      { message: 'Faça o mapeamento da planilha antes de enviar o processo para execução.' },
      { status: 400 },
    )
  }

  return null
}
