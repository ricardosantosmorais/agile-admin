import { describe, expect, it } from 'vitest'
import { buildDirtyConfiguracoesInicioPayload, normalizeConfiguracoesInicioRecord } from '@/src/features/configuracoes-inicio/services/configuracoes-inicio-mappers'

describe('configuracoes-inicio-mappers', () => {
  it('normaliza parÃ¢metros e lookups da tela de inÃ­cio', () => {
    const record = normalizeConfiguracoesInicioRecord({
      parameters: {
        data: [
          {
            chave: 'id_cliente_inicio',
            parametros: '123',
            created_at: '2026-04-02 08:00:00',
            usuario: { nome: 'Ricardo' },
          },
          {
            chave: 'id_forma_pagamento_inicio',
            parametros: '801',
          },
        ],
      },
      branches: { data: [{ id: '2', nome_fantasia: 'Matriz' }] },
      paymentMethods: { data: [{ id: '801', nome: 'PIX' }] },
      paymentConditions: { data: [{ id: '15', nome: '14/21 dias' }] },
      priceTables: { data: [{ id: '3', nome: 'PadrÃ£o' }] },
    })

    expect(record.values.id_cliente_inicio).toBe('123')
    expect(record.values.id_forma_pagamento_inicio).toBe('801')
    expect(record.metadata.id_cliente_inicio).toEqual({
      updatedAt: '2026-04-02 08:00:00',
      updatedBy: 'Ricardo',
    })
    expect(record.lookups.paymentMethods).toEqual([{ value: '801', fallbackLabel: 'PIX - 801' }])
    expect(record.lookups.branches).toEqual([{ value: '2', fallbackLabel: 'Matriz - 2' }])
  })

  it('gera payload parcial apenas com alteraÃ§Ãµes', () => {
    const payload = buildDirtyConfiguracoesInicioPayload(
      {
        id_cliente_inicio: '',
        coluna_preco_inicio: '1',
        id_filial_inicio: '',
        id_forma_pagamento_inicio: '',
        id_condicao_pagamento_inicio: '',
        desconto_pix: '',
        id_tabela_preco_inicio: '',
        informa_cep_localizacao: '0',
        tipo_forma_pagamento_inicio: '',
      },
      {
        id_cliente_inicio: '123',
        coluna_preco_inicio: '1',
        id_filial_inicio: '',
        id_forma_pagamento_inicio: '801',
        id_condicao_pagamento_inicio: '',
        desconto_pix: '',
        id_tabela_preco_inicio: '',
        informa_cep_localizacao: '1',
        tipo_forma_pagamento_inicio: '',
      },
      '2026-04-02 10:00:00',
    )

    expect(payload).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 10:00:00' },
      { id_filial: null, chave: 'id_cliente_inicio', parametros: '123' },
      { id_filial: null, chave: 'informa_cep_localizacao', parametros: '1' },
      { id_filial: null, chave: 'id_forma_pagamento_inicio', parametros: '801' },
    ])
  })
})


