import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient, HttpError, SESSION_LOST_EVENT } from '@/src/services/http/http-client'

describe('http-client session loss notifications', () => {
  const fetchMock = vi.fn()
  const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    dispatchEventSpy.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not dispatch session lost for auth session probing', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Sessao expirada.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(httpClient('/api/auth/session', { method: 'GET' })).rejects.toBeInstanceOf(HttpError)
    expect(dispatchEventSpy).not.toHaveBeenCalled()
  })

  it('dispatches session lost for protected business routes', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Sessao expirada.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(httpClient('/api/compre-e-ganhe/1', { method: 'GET' })).rejects.toBeInstanceOf(HttpError)
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1)

    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent
    expect(event.type).toBe(SESSION_LOST_EVENT)
  })
})
