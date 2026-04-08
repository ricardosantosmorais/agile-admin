import { describe, expect, it } from 'vitest'
import {
  buildWizardDraftFromApi,
  buildWizardPayload,
  flattenWizardDraft,
  excecaoProdutoDefaultDraft,
} from '@/src/features/excecoes-produtos/services/excecoes-produtos-mappers'

describe('excecoes-produtos-mappers', () => {
  it('flattens audience and product criteria into crossed rows', () => {
    const rows = flattenWizardDraft({
      ...excecaoProdutoDefaultDraft,
      audiences: [{ id: 'aud-1', type: 'filial', values: [{ id: '1', label: 'Matriz' }, { id: '2', label: 'Filial 2' }] }],
      products: [{ id: 'prd-1', type: 'produto', values: [{ id: '10', label: 'Produto 10' }] }],
      general: { ...excecaoProdutoDefaultDraft.general, ativo: true, orcamento: true, motivo: 'Sem exceção', metadata: '{"origem":"teste"}' },
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id_filial: '1',
      id_produto: '10',
      ativo: 1,
      orcamento: 1,
      motivo: 'Sem exceção',
      metadata: '{"origem":"teste"}',
    })
  })

  it('rebuilds wizard draft from parent and children rows', () => {
    const payload = buildWizardDraftFromApi({
      id: '500',
      ativo: 1,
      orcamento: 0,
      motivo: 'Bloqueio comercial',
      metadata: '{"escopo":"manual"}',
      id_filial: '1',
      filial: { id: '1', nome_fantasia: 'Matriz' },
      id_produto: '10',
      produto: { id: '10', nome: 'Produto 10' },
      filhos: [
        {
          id: '501',
          id_pai: '500',
          ativo: 1,
          orcamento: 0,
          motivo: 'Bloqueio comercial',
          metadata: '{"escopo":"manual"}',
          id_filial: '2',
          filial: { id: '2', nome_fantasia: 'Filial 2' },
          id_produto: '10',
          produto: { id: '10', nome: 'Produto 10' },
        },
      ],
    })

    expect(payload.draft.audiences[0]).toMatchObject({
      type: 'filial',
      values: [{ id: '1', label: 'Matriz' }, { id: '2', label: 'Filial 2' }],
    })
    expect(payload.draft.products[0]).toMatchObject({
      type: 'produto',
      values: [{ id: '10', label: 'Produto 10' }],
    })
    expect(payload.draft.general).toMatchObject({
      ativo: true,
      orcamento: false,
      motivo: 'Bloqueio comercial',
      metadata: '{"escopo":"manual"}',
    })
    expect(payload.originalRows).toHaveLength(2)
  })

  it('computes updates and deletes from original rows', () => {
    const payload = buildWizardPayload({
      ...excecaoProdutoDefaultDraft,
      audiences: [{ id: 'aud-1', type: 'todos', values: [] }],
      products: [{ id: 'prd-1', type: 'produto', values: [{ id: '10', label: 'Produto 10' }] }],
      general: { ...excecaoProdutoDefaultDraft.general, ativo: true, orcamento: false, motivo: 'Bloqueio', metadata: '' },
    }, [
      { id: '500', motivo: 'Bloqueio', id_produto: '10' },
      { id: '501', motivo: 'Bloqueio', id_produto: '20' },
    ], '500')

    expect(payload.rows).toHaveLength(1)
    expect(payload.rows[0].id).toBe('500')
    expect(payload.deleteIds).toEqual(['501'])
  })

  it('never reuses the parent id as a child id when editing reordered combinations', () => {
    const payload = buildWizardPayload({
      ...excecaoProdutoDefaultDraft,
      audiences: [{ id: 'aud-1', type: 'filial', values: [{ id: '1', label: 'Matriz' }, { id: '2', label: 'Filial 2' }] }],
      products: [{ id: 'prd-1', type: 'produto', values: [{ id: '10', label: 'Produto 10' }] }],
    }, [
      { id: '500', id_pai: null, id_filial: '2', id_produto: '10' },
      { id: '501', id_pai: '500', id_filial: '1', id_produto: '10' },
    ], '500')

    expect(payload.rows).toHaveLength(2)
    expect(payload.rows[0].id).toBe('500')
    expect(payload.rows[0].id_pai).toBeNull()
    expect(payload.rows[1].id).not.toBe('500')
    expect(payload.deleteIds).not.toContain('500')
  })
})
