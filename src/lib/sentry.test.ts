import { describe, expect, it } from 'vitest'
import { shouldReportOperationalError } from '@/src/lib/sentry'

describe('sentry operational error classification', () => {
  it('reports server failures', () => {
    expect(shouldReportOperationalError(500, { message: 'Internal Server Error' })).toBe(true)
  })

  it('reports backend contract errors even when status is 400', () => {
    expect(shouldReportOperationalError(400, { message: 'SQLSTATE[22007]: Invalid datetime format' })).toBe(true)
  })

  it('ignores common validation errors', () => {
    expect(shouldReportOperationalError(400, { message: 'validation.min.string' })).toBe(false)
  })
})
