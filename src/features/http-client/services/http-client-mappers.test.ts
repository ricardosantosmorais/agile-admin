import { describe, expect, it } from 'vitest'
import { createDefaultHttpClientRequest, normalizeHttpClientDraft } from '@/src/features/http-client/services/http-client-mappers'

describe('http-client-mappers', () => {
  it('creates a default draft with base url and sane defaults', () => {
    const draft = createDefaultHttpClientRequest('https://api.example.com')

    expect(draft.baseUrl).toBe('https://api.example.com')
    expect(draft.method).toBe('GET')
    expect(draft.endpointMode).toBe('agile')
    expect(draft.includeEmpresaHeader).toBe(true)
    expect(draft.headers).toEqual([{ key: 'Accept', value: 'application/json' }])
  })

  it('normalizes unsafe payload values', () => {
    const normalized = normalizeHttpClientDraft({
      method: 'trace',
      endpointMode: 'x',
      timeoutSeconds: -10,
      includeEmpresaHeader: '0',
      authType: 'invalid',
      headers: [{ key: '', value: 'x' }],
      queryRows: [{ key: '', value: 'x' }],
    })

    expect(normalized.method).toBe('GET')
    expect(normalized.endpointMode).toBe('agile')
    expect(normalized.timeoutSeconds).toBe(1)
    expect(normalized.includeEmpresaHeader).toBe(false)
    expect(normalized.authType).toBe('platform')
    expect(normalized.headers).toEqual([{ key: 'Accept', value: 'application/json' }])
    expect(normalized.queryRows).toEqual([{ key: '', value: '' }])
  })
})
