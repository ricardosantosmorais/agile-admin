export type RenewCacheResponse = {
  message: string
}

export function normalizeRenewCacheResponse(payload: unknown): RenewCacheResponse {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return {
      message: payload.message.trim() || 'Cache renovado com sucesso.',
    }
  }

  return {
    message: 'Cache renovado com sucesso.',
  }
}
