import { describe, expect, it } from 'vitest'
import { normalizeFormularioCampoRecord, serializeFormularioCampoRecord } from '@/src/features/formularios/services/formularios-campos-config'

describe('formularios-campos-config', () => {
  it('normalizes toggle-like fields from API payload', () => {
    const normalized = normalizeFormularioCampoRecord({
      ativo: 1,
      obrigatorio: '0',
      quebra_linha: '1',
      protegido: 0,
    })

    expect(normalized.ativo).toBe(true)
    expect(normalized.obrigatorio).toBe(false)
    expect(normalized.quebra_linha).toBe(true)
    expect(normalized.protegido).toBe(false)
  })

  it('serializes optional fields and clears selector/text/number specific payloads when needed', () => {
    const serialized = serializeFormularioCampoRecord({
      id_formulario: ' 99 ',
      ativo: '1',
      obrigatorio: true,
      quebra_linha: false,
      nome: ' campo_status ',
      titulo: ' Status ',
      tipo: 'texto',
      tipo_seletor: 'personalizado',
      json_seletor: '[{"titulo":"A","valor":"a"}]',
      mascara: '####',
      minimo: '1',
      maximo: '2',
      codigo: '',
      posicao: ' 3 ',
    })

    expect(serialized.id_formulario).toBe('99')
    expect(serialized.ativo).toBe(true)
    expect(serialized.codigo).toBeNull()
    expect(serialized.nome).toBe('campo_status')
    expect(serialized.titulo).toBe('Status')
    expect(serialized.mascara).toBe('####')
    expect(serialized.minimo).toBeNull()
    expect(serialized.maximo).toBeNull()
    expect(serialized.posicao).toBe('3')
    expect(serialized.tipo_seletor).toBeNull()
    expect(serialized.json_seletor).toBeNull()
  })

  it('keeps selector payload only for custom selector type', () => {
    const serialized = serializeFormularioCampoRecord({
      id_formulario: '1',
      nome: 'campo_origem',
      titulo: 'Campo de origem',
      tipo: 'seletor',
      tipo_seletor: 'personalizado',
      json_seletor: '[{"titulo":"Loja","valor":"1"}]',
      posicao: '1',
    })

    expect(serialized.tipo).toBe('seletor')
    expect(serialized.tipo_seletor).toBe('personalizado')
    expect(serialized.json_seletor).toBe('[{"titulo":"Loja","valor":"1"}]')
  })
})
