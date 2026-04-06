import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesProdutosPayload,
  normalizeConfiguracoesProdutosRecord,
} from '@/src/features/configuracoes-produtos/services/configuracoes-produtos-mappers'

describe('configuracoes-produtos-mappers', () => {
  it('normaliza parÃ¢metros de produtos com fallback de visibilidade legado', () => {
    const result = normalizeConfiguracoesProdutosRecord({
      data: [
        { chave: 'exibe_precos_filial', parametros: '1' },
        { chave: 'exibe_estoque_assistente_pesquisa', parametros: '0' },
        { chave: 'layout_padrao', parametros: 'grid', created_at: '2026-04-02 12:00:00', usuario: { nome: 'Administrador' } },
      ],
    })

    expect(result.values.exibe_precos_filial).toBe('todos')
    expect(result.values.exibe_estoque_assistente_pesquisa).toBe('nao')
    expect(result.values.layout_padrao).toBe('grid')
    expect(result.metadata.layout_padrao?.updatedBy).toBe('Administrador')
  })

  it('envia apenas os parÃ¢metros alterados de produtos', () => {
    const initialValues = {
      aviseme: '',
      comprar: '',
      estoque: '',
      exibe_estoque_assistente_pesquisa: '',
      exibe_precos_filial: '',
      exibicao_estoque: '',
      exibicao_estoque_busca: '',
      layout_padrao: '',
      mecanismo_busca: '',
      precisao_quantidade: '',
      produtos_sem_imagem: '',
      seleciona_embalagem: '',
      setar_quantidade_maxima: '',
      versao_restricao: '',
    }

    const currentValues = {
      ...initialValues,
      comprar: 'publico',
      layout_padrao: 'grid',
    }

    expect(buildDirtyConfiguracoesProdutosPayload(initialValues, currentValues, '2026-04-02 12:10:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 12:10:00' },
      { id_filial: null, chave: 'layout_padrao', parametros: 'grid' },
      { id_filial: null, chave: 'comprar', parametros: 'publico' },
    ])
  })
})


