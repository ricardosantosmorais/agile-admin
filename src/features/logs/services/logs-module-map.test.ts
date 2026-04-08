import { describe, expect, it } from 'vitest'
import { getLogModuleLabel, LOG_MODULE_OPTIONS } from '@/src/features/logs/services/logs-module-map'

describe('log module map', () => {
  it('maps legacy module code to friendly name', () => {
    expect(getLogModuleLabel('EPA')).toBe('Empresa Parâmetro')
    expect(getLogModuleLabel('ban')).toBe('Banner')
    expect(getLogModuleLabel('')).toBe('')
  })

  it('exposes sorted options for module filter', () => {
    expect(LOG_MODULE_OPTIONS.find((option) => option.value === 'EPA')?.label).toBe('Empresa Parâmetro')
  })
})

