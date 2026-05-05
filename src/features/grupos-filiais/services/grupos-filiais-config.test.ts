import { describe, expect, it } from 'vitest'
import { GRUPOS_FILIAIS_CONFIG } from '@/src/features/grupos-filiais/services/grupos-filiais-config'

describe('grupos filiais config', () => {
  it('restores and serializes the default branch lookup', () => {
    const normalized = GRUPOS_FILIAIS_CONFIG.normalizeRecord?.({
      id_filial_padrao: '12',
      filial_padrao: { id: '12', nome_fantasia: 'Filial Fortaleza' },
      id_filial_nf: '15',
      filial_nf: { id: '15', nome_fantasia: 'Filial NF' },
      id_tabela_preco: '8',
      tabela_preco: { id: '8', nome: 'Tabela balcão' },
    })

    expect(normalized).toMatchObject({
      id_filial_padrao_lookup: { id: '12', label: 'Filial Fortaleza' },
      id_filial_nf_lookup: { id: '15', label: 'Filial NF' },
      id_tabela_preco_lookup: { id: '8', label: 'Tabela balcão' },
    })

    const payload = GRUPOS_FILIAIS_CONFIG.beforeSave?.({
      id_filial_padrao: '12',
      id_filial_nf: '',
      id_tabela_preco: '8',
      id_filial_padrao_lookup: { id: '12', label: 'Filial 12' },
      id_filial_nf_lookup: null,
      id_tabela_preco_lookup: { id: '8', label: 'Tabela balcão' },
      codigo: '  CE  ',
      nome: '  Grupo Ceará  ',
    })

    expect(payload).toMatchObject({
      id_filial_padrao: '12',
      id_filial_nf: null,
      id_tabela_preco: '8',
      codigo: 'CE',
      nome: 'Grupo Ceará',
    })
    expect(payload?.id_filial_padrao_lookup).toBeUndefined()
    expect(payload?.id_filial_nf_lookup).toBeUndefined()
    expect(payload?.id_tabela_preco_lookup).toBeUndefined()
  })
})
