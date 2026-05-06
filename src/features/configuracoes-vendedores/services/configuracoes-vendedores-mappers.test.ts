import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesVendedoresPayload,
  createEmptyConfiguracoesVendedoresForm,
  normalizeConfiguracoesVendedoresRecord,
} from '@/src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers'

describe('configuracoes-vendedores-mappers', () => {
  it('normaliza parÃ¢metros e metadata de vendedores', () => {
    const result = normalizeConfiguracoesVendedoresRecord({
      data: [
        {
          chave: 'permite_acesso_vendedor',
          parametros: '1',
          created_at: '2026-04-02 13:00:00',
          usuario: { nome: 'Administrador' },
        },
        {
          chave: 'acesso_vendedor_1_de',
          parametros: '080000',
        },
      ],
    })

    expect(result.values.permite_acesso_vendedor).toBe('1')
    expect(result.values.acesso_vendedor_1_de).toBe('080000')
    expect(result.metadata.permite_acesso_vendedor?.updatedBy).toBe('Administrador')
  })

  it('envia apenas os parÃ¢metros alterados de vendedores', () => {
    const initialValues = createEmptyConfiguracoesVendedoresForm()

    const currentValues = {
      ...initialValues,
      permite_acesso_vendedor: '1',
      acesso_vendedor_1: '1',
      acesso_vendedor_1_de: '080000',
      acesso_vendedor_1_ate: '180059',
    }

    expect(buildDirtyConfiguracoesVendedoresPayload(initialValues, currentValues, '2026-04-02 13:10:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 13:10:00' },
      { id_filial: null, chave: 'permite_acesso_vendedor', parametros: '1' },
      { id_filial: null, chave: 'acesso_vendedor_1', parametros: '1' },
      { id_filial: null, chave: 'acesso_vendedor_1_de', parametros: '080000' },
      { id_filial: null, chave: 'acesso_vendedor_1_ate', parametros: '180059' },
    ])
  })

  it('normaliza parametros da area representante v2 e payload de cotas', () => {
    const initialValues = createEmptyConfiguracoesVendedoresForm()
    const normalized = normalizeConfiguracoesVendedoresRecord({
      data: [
        { chave: 'area_representante', parametros: 'v2' },
        { chave: 'preco_flexivel', parametros: 'S' },
        { chave: 'acrescimo_maximo', parametros: '12.5' },
        { chave: 'desconto_maximo', parametros: '8.25' },
        { chave: 'quantidade_cotas_vendedor', parametros: '4' },
      ],
    })

    expect(normalized.values.area_representante).toBe('v2')
    expect(normalized.values.preco_flexivel).toBe('S')
    expect(normalized.values.quantidade_cotas_vendedor).toBe('4')

    expect(buildDirtyConfiguracoesVendedoresPayload(initialValues, {
      ...initialValues,
      area_representante: 'v1',
      preco_flexivel: '',
      acrescimo_maximo: '12,50',
      desconto_maximo: '',
      quantidade_cotas_vendedor: '-3',
    }, '2026-04-10 11:20:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-10 11:20:00' },
      { id_filial: null, chave: 'area_representante', parametros: null },
      { id_filial: null, chave: 'acrescimo_maximo', parametros: '12.50' },
      { id_filial: null, chave: 'quantidade_cotas_vendedor', parametros: 0 },
    ])
  })
})


