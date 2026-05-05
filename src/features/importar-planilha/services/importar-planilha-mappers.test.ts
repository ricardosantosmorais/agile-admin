import { describe, expect, it } from 'vitest'
import { normalizeImportarPlanilhaResponse, normalizeProcessoArquivoDetail, normalizeProcessoArquivoMappingDetail } from '@/src/features/importar-planilha/services/importar-planilha-mappers'

describe('importar-planilha-mappers', () => {
  it('normalizes list response with status and pagination', () => {
    const result = normalizeImportarPlanilhaResponse({
      data: [
        {
          id: '10',
          created_at: '2026-03-01 12:30:00',
          status: 'rascunho',
          usuario: { nome: 'Maria' },
        },
      ],
      meta: {
        page: 2,
        pages: 4,
        perpage: 15,
        total: 44,
        from: 16,
        to: 30,
      },
    }, { page: 1, perPage: 15 })

    expect(result.data[0].id).toBe('10')
    expect(result.data[0].usuarioNome).toBe('Maria')
    expect(result.data[0].statusLabel).toBe('Rascunho')
    expect(result.data[0].canStart).toBe(true)
    expect(result.meta.page).toBe(2)
    expect(result.meta.pages).toBe(4)
  })

  it('normalizes detail with logs', () => {
    const result = normalizeProcessoArquivoDetail({
      id: '99',
      status: 'erro',
      processado: 0,
      data_processado: '',
      usuario: { nome: 'João' },
      logs: [
        { id: '1', tipo: 'erro', created_at: '2026-03-01 13:00:00', mensagem: 'Falha no processamento' },
      ],
    })

    expect(result.id).toBe('99')
    expect(result.statusLabel).toBe('Erro')
    expect(result.logs).toHaveLength(1)
    expect(result.logs[0].tipoLabel).toBe('Erro')
  })

  it('normalizes mapping detail with dictionary fields and preview', () => {
    const result = normalizeProcessoArquivoMappingDetail({
      processo: {
        id: '186',
        status: 'rascunho',
        usuario: { nome: 'Maria' },
        mapeamentos: [],
      },
      dicionarios: [
        {
          id: 'TAB1',
          nome: 'Clientes',
          campos: [
            { id: 'CAM2', nome: 'Nome', tipo: 'varchar', nulo: 'YES', posicao: 2 },
            { id: 'CAM1', nome: 'Código', tipo: 'number', nulo: 'NO', posicao: 1 },
            { id: 'CAM3', nome: 'Interno', tipo: 'number', nulo: 'YES', posicao: 3, integra_planilha: 0 },
          ],
        },
      ],
      mapeamentos: [
        { id: 'MAP1', id_tabela: 'TAB1', coluna_origem: 'A', id_campo: 'CAM1' },
      ],
      preview: {
        sheetName: 'Planilha1',
        columns: [{ letter: 'A', name: 'Código' }],
        rows: [[123]],
        previewRows: 1,
      },
    })

    expect(result.processo.id).toBe('186')
    expect(result.tables[0].fields.map((field) => field.id)).toEqual(['CAM1', 'CAM2'])
    expect(result.tables[0].fields[0].id).toBe('CAM1')
    expect(result.tables[0].fields[0].required).toBe(true)
    expect(result.mappings[0].targetFieldId).toBe('CAM1')
    expect(result.preview.rows[0][0]).toBe('123')
  })
})
