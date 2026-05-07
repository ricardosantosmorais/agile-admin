import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSessionClientPhase, setSessionClientPhase } from '@/src/features/auth/services/session-client-gate'
import { httpClient, HttpError, SESSION_LOST_EVENT } from '@/src/services/http/http-client'

describe('http-client session loss notifications', () => {
  const fetchMock = vi.fn()
  const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    dispatchEventSpy.mockClear()
    clearSessionClientPhase()
  })

  afterEach(() => {
    clearSessionClientPhase()
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

  it('dispatches session lost for invalid tenant context responses', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      message: 'Contexto da sessao invalido.',
      error: { code: 'TENANT_CONTEXT_INVALID' },
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(httpClient('/api/dashboard', { method: 'GET' })).rejects.toBeInstanceOf(HttpError)
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1)

    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent
    expect(event.type).toBe(SESSION_LOST_EVENT)
    expect(event.detail).toEqual(expect.objectContaining({
      reason: 'tenant_context_invalid',
      status: 403,
      path: '/api/dashboard',
    }))
  })

  it('does not dispatch session lost for regular forbidden responses', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Acesso negado.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(httpClient('/api/dashboard', { method: 'GET' })).rejects.toBeInstanceOf(HttpError)
    expect(dispatchEventSpy).not.toHaveBeenCalled()
  })

  it('blocks protected requests locally while the session is locked in the client', async () => {
    setSessionClientPhase('ended')

    await expect(httpClient('/api/dashboard', { method: 'POST' })).rejects.toMatchObject({
      status: 401,
      payload: expect.objectContaining({
        blockedByClientSessionGate: true,
        phase: 'ended',
      }),
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('still allows auth session probes while the warning modal is open', async () => {
    setSessionClientPhase('warning')
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(httpClient('/api/auth/session', { method: 'GET' })).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends the active tab tenant on protected app api requests', async () => {
    window.sessionStorage.setItem('admin-v2-web:tenant', 'agileecommerce')
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(httpClient('/api/dashboard-agileecommerce', { method: 'POST' })).resolves.toEqual({ ok: true })

    expect(fetchMock).toHaveBeenCalledWith('/api/dashboard-agileecommerce', expect.objectContaining({
      headers: expect.objectContaining({
        'X-Admin-V2-Tenant-Id': 'agileecommerce',
      }),
    }))
  })
})
