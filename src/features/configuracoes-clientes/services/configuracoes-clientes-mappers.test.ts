import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesClientesPayload,
  buildConfiguracoesClientesPayload,
  configuracoesClientesFieldDefinitions,
  createEmptyConfiguracoesClientesForm,
  normalizeConfiguracoesClientesRecord,
} from '@/src/features/configuracoes-clientes/services/configuracoes-clientes-mappers'

describe('configuracoes-clientes-mappers', () => {
  it('normaliza valores e metadata de empresas/parametros', () => {
    const result = normalizeConfiguracoesClientesRecord({
      data: [
        {
          chave: 'forma_ativacao_cliente',
          parametros: 'email',
          created_at: '2026-04-02 08:30:00',
          usuario: { nome: 'Ricardo Morais' },
        },
        {
          chave: 'senha_forte',
          parametros: '1',
          created_at: '2026-04-02 08:35:00',
          usuario: { nome: 'Administrador' },
        },
        {
          chave: 'inexistente_no_formulario',
          parametros: 'ignorar',
        },
      ],
    })

    expect(result.values.forma_ativacao_cliente).toBe('email')
    expect(result.values.senha_forte).toBe('1')
    expect(result.metadata.forma_ativacao_cliente).toEqual({
      updatedAt: '2026-04-02 08:30:00',
      updatedBy: 'Ricardo Morais',
    })
    expect(result.metadata.senha_forte?.updatedBy).toBe('Administrador')
  })

  it('serializa payload com versao e todos os campos do formulario', () => {
    const values = createEmptyConfiguracoesClientesForm()
    values.forma_ativacao_cliente = 'email'
    values.senha_forte = '1'
    values.ufs_cadastro_cliente = 'CE,PE'

    const payload = buildConfiguracoesClientesPayload(values, '2026-04-02 09:10:11')

    expect(payload[0]).toEqual({
      id_filial: null,
      chave: 'versao',
      parametros: '2026-04-02 09:10:11',
    })

    expect(payload).toContainEqual({
      id_filial: null,
      chave: 'forma_ativacao_cliente',
      parametros: 'email',
    })

    expect(payload).toContainEqual({
      id_filial: null,
      chave: 'senha_forte',
      parametros: '1',
    })

    expect(payload).toContainEqual({
      id_filial: null,
      chave: 'ufs_cadastro_cliente',
      parametros: 'CE,PE',
    })
  })

  it('serializa apenas os campos alterados quando o payload e parcial', () => {
    const initialValues = createEmptyConfiguracoesClientesForm()
    const currentValues = createEmptyConfiguracoesClientesForm()
    currentValues.forma_ativacao_cliente = 'email'
    currentValues.senha_forte = '1'

    const payload = buildDirtyConfiguracoesClientesPayload(initialValues, currentValues, '2026-04-02 09:10:11')

    expect(payload).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 09:10:11' },
      { id_filial: null, chave: 'forma_ativacao_cliente', parametros: 'email' },
      { id_filial: null, chave: 'senha_forte', parametros: '1' },
    ])
  })

  it('trata seleciona_filial como perfil de visibilidade mantendo compatibilidade com valores booleanos legados', () => {
    const field = configuracoesClientesFieldDefinitions.find((definition) => definition.key === 'seleciona_filial')

    expect(field?.type).toBe('enum')
    expect(field?.options?.map((option) => option.value)).toEqual(['cliente', 'vendedor', 'todos', 'nao'])

    const normalized = normalizeConfiguracoesClientesRecord({
      data: [
        { chave: 'seleciona_filial', parametros: '1' },
        { chave: 'qualquer_filial', parametros: '0' },
      ],
    })

    expect(normalized.values.seleciona_filial).toBe('todos')
    expect(normalized.values.qualquer_filial).toBe('0')

    const initialValues = createEmptyConfiguracoesClientesForm()
    const currentValues = createEmptyConfiguracoesClientesForm()
    currentValues.seleciona_filial = 'vendedor'

    expect(buildDirtyConfiguracoesClientesPayload(initialValues, currentValues, '2026-04-23 10:00:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-23 10:00:00' },
      { id_filial: null, chave: 'seleciona_filial', parametros: 'vendedor' },
    ])
  })

  it('inclui o parametro de contato duplicado com opcoes sim e nao', () => {
    const field = configuracoesClientesFieldDefinitions.find((definition) => definition.key === 'permite_cadastro_contato_duplicado')

    expect(field).toMatchObject({
      section: 'rules',
      type: 'boolean',
    })
    expect(field?.options?.map((option) => option.value)).toEqual(['1', '0'])

    const normalized = normalizeConfiguracoesClientesRecord({
      data: [{ chave: 'permite_cadastro_contato_duplicado', parametros: '0' }],
    })

    expect(normalized.values.permite_cadastro_contato_duplicado).toBe('0')

    const initialValues = createEmptyConfiguracoesClientesForm()
    const currentValues = createEmptyConfiguracoesClientesForm()
    currentValues.permite_cadastro_contato_duplicado = '1'

    expect(buildDirtyConfiguracoesClientesPayload(initialValues, currentValues, '2026-04-28 08:30:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-28 08:30:00' },
      { id_filial: null, chave: 'permite_cadastro_contato_duplicado', parametros: '1' },
    ])
  })
})


