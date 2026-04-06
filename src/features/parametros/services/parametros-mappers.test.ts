import { describe, expect, it } from 'vitest'
import {
  buildParametroSavePayload,
  createEmptyParametroFormValues,
  normalizeParametroFormRecord,
  normalizeParametroViewRecord,
  normalizeParametrosListResponse,
} from '@/src/features/parametros/services/parametros-mappers'

describe('parametros-mappers', () => {
  it('normaliza a listagem de parâmetros da empresa', () => {
    const result = normalizeParametrosListResponse({
      data: [
        {
          id: '10',
          chave: 'header-component',
          descricao: 'Cabeçalho',
          parametros: '{"ativo":true}',
          posicao: 3,
          permissao: 'publico',
          ativo: 1,
          filial: {
            id: '1',
            nome_fantasia: 'Matriz',
          },
        },
      ],
      meta: {
        total: 1,
        page: 1,
        perpage: 15,
        pages: 1,
      },
    }, { page: 1, perPage: 15 })

    expect(result.data[0]).toEqual({
      id: '10',
      chave: 'header-component',
      filial: 'Matriz - 1',
      descricao: 'Cabeçalho',
      parametrosPreview: '{"ativo":true}',
      parametrosRaw: '{"ativo":true}',
      posicao: '3',
      permissao: 'publico',
      ativo: true,
    })
  })

  it('normaliza formulário e visualização do parâmetro da empresa', () => {
    const payload = {
      id: '10',
      ativo: true,
      chave: 'footer-component',
      id_filial: '3',
      descricao: 'Rodapé',
      parametros: '{"rodape":true}',
      posicao: '8',
      permissao: 'restrito',
      filial: {
        id: '3',
        nome_fantasia: 'Filial Norte',
      },
      filiais: {
        data: [
          { id: '3', nome_fantasia: 'Filial Norte' },
        ],
      },
    }

    const formRecord = normalizeParametroFormRecord(payload)
    const viewRecord = normalizeParametroViewRecord(payload)

    expect(formRecord.values.chave).toBe('footer-component')
    expect(formRecord.filiais[0]).toEqual({ value: '3', label: 'Filial Norte - 3' })
    expect(viewRecord.filial).toBe('Filial Norte - 3')
    expect(viewRecord.permissao).toBe('Restrito')
    expect(viewRecord.ativo).toBe(true)
    expect(viewRecord.parametros).toBe('{"rodape":true}')
  })

  it('serializa o payload de gravação da empresa', () => {
    const values = createEmptyParametroFormValues()
    values.id = '10'
    values.ativo = '0'
    values.chave = '  topbar-component '
    values.id_filial = ''
    values.descricao = ' topo principal '
    values.parametros = '{"ok":true}'
    values.posicao = '5'
    values.permissao = 'todos'

    expect(buildParametroSavePayload(values)).toEqual({
      id: '10',
      ativo: false,
      chave: 'topbar-component',
      id_filial: null,
      descricao: 'topo principal',
      parametros: '{"ok":true}',
      posicao: '5',
      permissao: 'todos',
      componente: 1,
    })
  })
})
