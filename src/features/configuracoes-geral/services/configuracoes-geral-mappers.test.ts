import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesGeralPayload,
  normalizeConfiguracoesGeralRecord,
} from '@/src/features/configuracoes-geral/services/configuracoes-geral-mappers'

describe('configuracoes-geral-mappers', () => {
  it('normaliza schema dinÃ¢mico, parÃ¢metros e fallback dos dados da empresa', () => {
    const result = normalizeConfiguracoesGeralRecord({
      schema: {
        data: [
          {
            chave: 'modo_ecommerce',
            nome: 'Modo e-commerce',
            descricao: 'Modo principal do tenant.',
            tipo_entrada: 'combo',
            fonte_dados: 'lista_fixa',
            dados: JSON.stringify([
              { value: 'b2b', text: 'B2B' },
              { value: 'b2c', text: 'B2C' },
            ]),
            ordem: 2,
          },
          {
            chave: 'url_site',
            nome: 'URL do site',
            descricao: 'URL pÃºblica da operaÃ§Ã£o.',
            tipo_entrada: 'texto',
            ordem: 1,
          },
        ],
      },
      parameters: {
        data: [
          {
            chave: 'modo_ecommerce',
            parametros: 'b2b',
            created_at: '2026-04-02 12:00:00',
            usuario: { nome: 'Administrador' },
          },
        ],
      },
      company: {
        data: [
          {
            id: '77',
            codigo: '117',
            id_template: '12',
            url: 'https://tenant.exemplo.com.br',
          },
        ],
      },
    })

    expect(result.fields.map((field) => field.key)).toEqual(['url_site', 'modo_ecommerce'])
    expect(result.values.url_site).toBe('https://tenant.exemplo.com.br')
    expect(result.values.modo_ecommerce).toBe('b2b')
    expect(result.fields[1]?.options).toEqual([
      { value: 'b2b', label: 'B2B' },
      { value: 'b2c', label: 'B2C' },
    ])
    expect(result.metadata.modo_ecommerce?.updatedBy).toBe('Administrador')
    expect(result.company).toEqual({
      id: '77',
      codigo: '117',
      idTemplate: '12',
    })
  })

  it('serializa apenas campos alterados e separa patch da empresa', () => {
    const fields = [
      {
        key: 'modo_ecommerce',
        label: 'Modo e-commerce',
        description: '',
        type: 'enum' as const,
        options: [],
        order: 1,
        companyField: 'tipo' as const,
      },
      {
        key: 'url_imagens',
        label: 'URL de imagens',
        description: '',
        type: 'text' as const,
        options: [],
        order: 2,
        companyField: 's3_bucket' as const,
      },
      {
        key: 'titulo_loja',
        label: 'TÃ­tulo',
        description: '',
        type: 'text' as const,
        options: [],
        order: 3,
      },
    ]

    const initialValues = {
      modo_ecommerce: 'b2b',
      url_imagens: '',
      titulo_loja: 'Loja antiga',
    }

    const currentValues = {
      modo_ecommerce: 'b2b',
      url_imagens: 'cdn.exemplo.com.br',
      titulo_loja: 'Loja nova',
    }

    const payload = buildDirtyConfiguracoesGeralPayload(fields, initialValues, currentValues, '77', '2026-04-02 12:30:00')

    expect(payload.company).toEqual({
      id: '77',
      s3_bucket: 'https://cdn.exemplo.com.br',
    })
    expect(payload.parameters).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 12:30:00' },
      { id_filial: null, chave: 'url_imagens', parametros: 'cdn.exemplo.com.br' },
      { id_filial: null, chave: 'titulo_loja', parametros: 'Loja nova' },
    ])
  })
})


