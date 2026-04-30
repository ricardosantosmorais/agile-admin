import { describe, expect, it } from 'vitest'
import { resolveRequestTenantId } from '@/src/features/auth/services/request-tenant'

describe('resolveRequestTenantId', () => {
  it('uses the explicit body tenant before the tab header and cookie tenant', () => {
    const request = new Request('http://localhost/api/dashboard', {
      headers: {
        'X-Admin-V2-Tenant-Id': 'agileecommerce',
      },
    })

    expect(resolveRequestTenantId(request, {
      currentTenantId: 'cookie-tenant',
    }, 'body-tenant')).toBe('body-tenant')
  })

  it('uses the active tab tenant header before the shared cookie tenant', () => {
    const request = new Request('http://localhost/api/dashboard-agileecommerce', {
      headers: {
        'X-Admin-V2-Tenant-Id': 'agileecommerce',
      },
    })

    expect(resolveRequestTenantId(request, {
      currentTenantId: '1698203521854804',
    })).toBe('agileecommerce')
  })

  it('falls back to the cookie tenant when the request has no tab tenant', () => {
    const request = new Request('http://localhost/api/dashboard')

    expect(resolveRequestTenantId(request, {
      currentTenantId: '1698203521854804',
    })).toBe('1698203521854804')
  })
})
