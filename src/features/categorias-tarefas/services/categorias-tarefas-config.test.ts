import { describe, expect, it } from 'vitest'
import { CATEGORIAS_TAREFAS_CONFIG } from '@/src/features/categorias-tarefas/services/categorias-tarefas-config'

describe('categorias tarefas config', () => {
  it('keeps the legacy list and form fields', () => {
    expect(CATEGORIAS_TAREFAS_CONFIG.resource).toBe('implantacao/categorias_tarefas')
    expect(CATEGORIAS_TAREFAS_CONFIG.routeBase).toBe('/cadastros/categorias-tarefas')
    expect(CATEGORIAS_TAREFAS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'fase', 'nome', 'posicao', 'ativo'])
    expect(CATEGORIAS_TAREFAS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'id_fase', 'codigo', 'nome', 'posicao'])
  })
})
