import { describe, expect, it } from 'vitest'
import { TAREFAS_CONFIG } from '@/src/features/tarefas/services/tarefas-config'

describe('tarefas config', () => {
  it('keeps the legacy list and form fields', () => {
    expect(TAREFAS_CONFIG.resource).toBe('implantacao/tarefas')
    expect(TAREFAS_CONFIG.routeBase).toBe('/cadastros/tarefas')
    expect(TAREFAS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(TAREFAS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'id_empresa', 'id_fase', 'id_categoria', 'nome', 'posicao', 'descricao', 'codigo'])
  })
})
