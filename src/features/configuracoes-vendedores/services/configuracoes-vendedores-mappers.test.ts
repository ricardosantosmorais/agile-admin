import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesVendedoresPayload,
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
    const initialValues = {
      associa_vendedor_cliente: '',
      exibe_precos_cliente: '',
      forma_ativacao_vendedor: '',
      menu_acesso_vendedor: '',
      permite_acesso_vendedor: '',
      permite_cadastro_cliente_vendedor: '',
      permite_desconto_vendedor: '',
      tipo_cliente: '',
      tipo_vendedor: '',
      tipo_vendedor_padrao: '',
      altera_carrinho_cliente: '',
      acesso_vendedor_0: '',
      acesso_vendedor_0_de: '',
      acesso_vendedor_0_ate: '',
      acesso_vendedor_1: '',
      acesso_vendedor_1_de: '',
      acesso_vendedor_1_ate: '',
      acesso_vendedor_2: '',
      acesso_vendedor_2_de: '',
      acesso_vendedor_2_ate: '',
      acesso_vendedor_3: '',
      acesso_vendedor_3_de: '',
      acesso_vendedor_3_ate: '',
      acesso_vendedor_4: '',
      acesso_vendedor_4_de: '',
      acesso_vendedor_4_ate: '',
      acesso_vendedor_5: '',
      acesso_vendedor_5_de: '',
      acesso_vendedor_5_ate: '',
      acesso_vendedor_6: '',
      acesso_vendedor_6_de: '',
      acesso_vendedor_6_ate: '',
    }

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
})


