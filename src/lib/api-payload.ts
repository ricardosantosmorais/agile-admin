export function extractSavedId(payload: unknown) {
  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0]
    if (typeof first === 'object' && first !== null && 'id' in first && typeof first.id === 'string') {
      return first.id
    }
  }

  if (typeof payload === 'object' && payload !== null && 'id' in payload && typeof payload.id === 'string') {
    return payload.id
  }

  return null
}
