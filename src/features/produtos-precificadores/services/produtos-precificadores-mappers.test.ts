import { describe, expect, it } from 'vitest'
import {
  buildWizardDraftFromApi,
  buildWizardPayload,
  flattenWizardDraft,
  produtoPrecificadorDefaultDraft,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-mappers'

describe('produtos-precificadores-mappers', () => {
  it('flattens wizard draft into crossed rows', () => {
    const rows = flattenWizardDraft({
      ...produtoPrecificadorDefaultDraft,
      audiences: [
        {
          id: 'aud-1',
          type: 'filial',
          values: [
            { id: '1', label: 'Filial 1' },
            { id: '2', label: 'Filial 2' },
          ],
        },
      ],
      products: [
        {
          id: 'prd-1',
          type: 'produto',
          values: [{ id: '10', label: 'Produto 10' }],
          packaging: { id: '99', label: 'Caixa' },
        },
      ],
      definitions: [
        {
          id: 'def-1',
          ultimo_preco: false,
          preco: '10,00',
          desconto: '2,50',
          acrescimo: '',
          pedido_minimo: '100,00',
          pedido_maximo: '',
          itens_pedido_de: '2',
          itens_pedido_ate: '',
        },
      ],
      general: {
        ...produtoPrecificadorDefaultDraft.general,
        nome: 'Precificador teste',
        tipo: 'fixo',
        origem: 'todos',
      },
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      nome: 'Precificador teste',
      id_filial: '1',
      id_produto: '10',
      id_embalagem: '99',
      preco: 10,
      desconto: 2.5,
      pedido_minimo: 100,
      itens_pedido_de: 2,
    })
    expect(rows[1].id_filial).toBe('2')
  })

  it('rebuilds wizard draft from parent and children rows', () => {
    const payload = buildWizardDraftFromApi({
      id: '500',
      nome: 'Regra base',
      tipo: 'fixo',
      origem: 'todos',
      id_filial: '1',
      filial: { id: '1', nome_fantasia: 'Matriz' },
      id_produto: '10',
      produto: { id: '10', nome: 'Produto 10' },
      id_embalagem: '99',
      embalagem: { id: '99', nome: 'Caixa' },
      preco: 12.5,
      desconto: 1,
      filhos: [
        {
          id: '501',
          id_pai: '500',
          nome: 'Regra base',
          tipo: 'fixo',
          origem: 'todos',
          id_filial: '2',
          filial: { id: '2', nome_fantasia: 'Filial 2' },
          id_produto: '10',
          produto: { id: '10', nome: 'Produto 10' },
          id_embalagem: '99',
          embalagem: { id: '99', nome: 'Caixa' },
          preco: 12.5,
          desconto: 1,
        },
      ],
    })

    expect(payload.draft.audiences[0]).toMatchObject({
      type: 'filial',
      values: [
        { id: '1', label: 'Matriz' },
        { id: '2', label: 'Filial 2' },
      ],
    })
    expect(payload.draft.products[0]).toMatchObject({
      type: 'produto',
      values: [{ id: '10', label: 'Produto 10' }],
      packaging: { id: '99', label: 'Caixa' },
    })
    expect(payload.originalRows).toHaveLength(2)
  })

  it('computes updates and deletes from original rows', () => {
    const payload = buildWizardPayload({
      ...produtoPrecificadorDefaultDraft,
      audiences: [{ id: 'aud-1', type: 'todos', values: [] }],
      products: [{ id: 'prd-1', type: 'produto', values: [{ id: '10', label: 'Produto 10' }], packaging: null }],
      definitions: [{
        id: 'def-1',
        ultimo_preco: false,
        preco: '15,00',
        desconto: '',
        acrescimo: '',
        pedido_minimo: '',
        pedido_maximo: '',
        itens_pedido_de: '',
        itens_pedido_ate: '',
      }],
      general: {
        ...produtoPrecificadorDefaultDraft.general,
        nome: 'Regra base',
        tipo: 'fixo',
        origem: 'todos',
      },
    }, [
      { id: '500', nome: 'Regra base', tipo: 'fixo', origem: 'todos', id_produto: '10', preco: 10 },
      { id: '501', nome: 'Regra base', tipo: 'fixo', origem: 'todos', id_produto: '20', preco: 10 },
    ], '500')

    expect(payload.rows).toHaveLength(1)
    expect(payload.rows[0].id).toBe('500')
    expect(payload.deleteIds).toEqual(['501'])
  })
})
