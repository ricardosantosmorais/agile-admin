import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesEntregasPayload,
  createEmptyConfiguracoesEntregasForm,
  normalizeConfiguracoesEntregasRecord,
} from '@/src/features/configuracoes-entregas/services/configuracoes-entregas-mappers'

describe('configuracoes-entregas-mappers', () => {
  it('normaliza parÃ¢metros e opÃ§Ãµes de formas de entrega', () => {
    const result = normalizeConfiguracoesEntregasRecord({
      parameters: {
        data: [
          {
            chave: 'calcula_frete',
            parametros: '1',
            created_at: '2026-04-02 10:20:00',
            usuario: { nome: 'Administrador' },
          },
          {
            chave: 'id_forma_entrega_padrao',
            parametros: '55',
          },
        ],
      },
      deliveryMethods: {
        data: [
          { id: '55', nome: 'Entrega expressa' },
          { id: '99', nome: 'Retirada na loja' },
        ],
      },
    })

    expect(result.values.calcula_frete).toBe('1')
    expect(result.values.id_forma_entrega_padrao).toBe('55')
    expect(result.deliveryMethods).toEqual([
      { value: '55', fallbackLabel: 'Entrega expressa - 55' },
      { value: '99', fallbackLabel: 'Retirada na loja - 99' },
    ])
    expect(result.metadata.calcula_frete?.updatedBy).toBe('Administrador')
  })

  it('serializa apenas os parÃ¢metros alterados', () => {
    const initialValues = createEmptyConfiguracoesEntregasForm()
    const currentValues = createEmptyConfiguracoesEntregasForm()
    currentValues.calcula_frete = '1'
    currentValues.id_forma_entrega_padrao = '55'

    const payload = buildDirtyConfiguracoesEntregasPayload(initialValues, currentValues, '2026-04-02 10:30:00')

    expect(payload).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 10:30:00' },
      { id_filial: null, chave: 'calcula_frete', parametros: '1' },
      { id_filial: null, chave: 'id_forma_entrega_padrao', parametros: '55' },
    ])
  })
})


