import { describe, expect, it } from 'vitest'
import { TABELAS_PRECO_CONFIG } from '@/src/features/tabelas-preco/services/tabelas-preco-config'

describe('tabelas preco config', () => {
  it('trims textual payload fields', () => {
    const payload = TABELAS_PRECO_CONFIG.beforeSave?.({
      codigo: ' TAB-1 ',
      nome: ' Tabela padrão ',
    })

    expect(payload).toMatchObject({
      codigo: 'TAB-1',
      nome: 'Tabela padrão',
    })
  })
})
