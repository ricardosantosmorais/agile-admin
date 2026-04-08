import { describe, expect, it } from 'vitest'
import { buildJsonDiffRows } from '@/src/features/logs/services/logs-diff'

describe('buildJsonDiffRows', () => {
  it('returns changed, added and removed rows', () => {
    const rows = buildJsonDiffRows(
      JSON.stringify({ nome: 'Joao', ativo: true, nested: { a: 1 }, list: [1, 2] }),
      JSON.stringify({ nome: 'Maria', nested: { a: 2 }, list: [1, 3], novo: 'ok' }),
    )

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'nome', kind: 'changed', previousValue: 'Joao', nextValue: 'Maria' }),
        expect.objectContaining({ path: 'ativo', kind: 'removed', previousValue: 'true', nextValue: '-' }),
        expect.objectContaining({ path: 'nested.a', kind: 'changed', previousValue: '1', nextValue: '2' }),
        expect.objectContaining({ path: 'list[1]', kind: 'changed', previousValue: '2', nextValue: '3' }),
        expect.objectContaining({ path: 'novo', kind: 'added', previousValue: '-', nextValue: 'ok' }),
      ]),
    )
  })

  it('returns empty rows when both snapshots are invalid or empty', () => {
    expect(buildJsonDiffRows('', null)).toEqual([])
    expect(buildJsonDiffRows('{', '{')).toEqual([])
  })
})

