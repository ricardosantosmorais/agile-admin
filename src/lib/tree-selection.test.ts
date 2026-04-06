import { describe, expect, it } from 'vitest'
import {
  collectIndeterminateTreeIds,
  getTreeSelectionState,
  normalizeTreeSelection,
  serializeTreeSelection,
  toggleTreeSelection,
  type TreeSelectionNode,
} from '@/src/lib/tree-selection'

const tree: TreeSelectionNode[] = [
  {
    id: 'admin',
    children: [
      {
        id: 'cadastros',
        children: [
          { id: 'clientes' },
          { id: 'vendedores' },
        ],
      },
      {
        id: 'relatorios',
        children: [
          { id: 'pedidos' },
        ],
      },
    ],
  },
]

describe('tree-selection', () => {
  it('expande descendentes ao normalizar pai selecionado', () => {
    expect(normalizeTreeSelection(tree, ['cadastros'])).toEqual(
      expect.arrayContaining(['cadastros', 'clientes', 'vendedores']),
    )
  })

  it('seleciona ascendentes quando todos os filhos estão marcados', () => {
    expect(normalizeTreeSelection(tree, ['clientes', 'vendedores', 'pedidos'])).toEqual(
      expect.arrayContaining(['admin', 'cadastros', 'clientes', 'vendedores', 'relatorios', 'pedidos']),
    )
  })

  it('marca pai como indeterminado quando só parte dos filhos está selecionada', () => {
    expect(collectIndeterminateTreeIds(tree, ['clientes'])).toEqual(
      expect.arrayContaining(['cadastros', 'admin']),
    )
    expect(getTreeSelectionState(tree, ['clientes'], 'cadastros')).toBe('indeterminate')
  })

  it('faz toggle em cascata para ligar e desligar subárvore', () => {
    const selected = toggleTreeSelection(tree, [], 'cadastros')
    expect(selected).toEqual(expect.arrayContaining(['cadastros', 'clientes', 'vendedores']))

    const cleared = toggleTreeSelection(tree, selected, 'cadastros')
    expect(cleared).not.toEqual(expect.arrayContaining(['cadastros', 'clientes', 'vendedores']))
  })

  it('serializa seleção incluindo pais parciais', () => {
    expect(serializeTreeSelection(tree, ['clientes'])).toEqual(
      expect.arrayContaining(['clientes', 'cadastros', 'admin']),
    )
  })
})
