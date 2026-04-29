import { describe, expect, it } from 'vitest'
import { RELATORIOS_MASTER_CONFIG } from '@/src/features/relatorios-master/services/relatorios-master-config'

describe('relatorios master config', () => {
  it('keeps the legacy general fields and management route', () => {
    expect(RELATORIOS_MASTER_CONFIG.resource).toBe('relatorios')
    expect(RELATORIOS_MASTER_CONFIG.routeBase).toBe('/cadastros/relatorios-v2')
    expect(RELATORIOS_MASTER_CONFIG.stayOnSave).toBe(true)
    expect(RELATORIOS_MASTER_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'grupo', 'nome', 'ativo'])
    expect(RELATORIOS_MASTER_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome', 'id_grupo', 'icone'])
  })
})
