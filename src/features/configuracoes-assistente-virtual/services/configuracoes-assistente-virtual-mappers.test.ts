import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesAssistenteVirtualPayload,
  normalizeConfiguracoesAssistenteVirtualRecord,
} from '@/src/features/configuracoes-assistente-virtual/services/configuracoes-assistente-virtual-mappers'

describe('configuracoes-assistente-virtual-mappers', () => {
  it('normaliza os valores do assistente virtual e metadata por campo', () => {
    const result = normalizeConfiguracoesAssistenteVirtualRecord({
      data: [
        {
          chave: 'ia_ativo',
          parametros: '1',
          created_at: '2026-04-03 10:15:00',
          usuario: { nome: 'Administrador' },
        },
        {
          chave: 'ia_nome',
          parametros: 'Agile Assistente',
        },
        {
          chave: 'ia_avatar',
          parametros: 'https://bucket/imgs/avatar.png',
        },
      ],
    })

    expect(result.values.ia_ativo).toBe('1')
    expect(result.values.ia_nome).toBe('Agile Assistente')
    expect(result.values.ia_avatar).toBe('https://bucket/imgs/avatar.png')
    expect(result.metadata.ia_ativo).toEqual({
      updatedAt: '2026-04-03 10:15:00',
      updatedBy: 'Administrador',
    })
  })

  it('serializa apenas os campos alterados', () => {
    const initialValues = {
      ia_ativo: '0',
      ia_nome: '',
      ia_avatar: '',
      ia_mensagem_mix_cliente: '',
      ia_mensagem_mix_segmento: '',
      ia_mensagem_alta_preco: '',
      ia_mensagem_falta: '',
      ia_mensagem_frequencia_compra: '',
      ia_mensagem_recomendados: '',
    }

    const payload = buildDirtyConfiguracoesAssistenteVirtualPayload(initialValues, {
      ...initialValues,
      ia_ativo: '1',
      ia_nome: 'Copiloto',
    }, '2026-04-03 10:20:00')

    expect(payload).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-03 10:20:00' },
      { id_filial: null, chave: 'ia_ativo', parametros: '1' },
      { id_filial: null, chave: 'ia_nome', parametros: 'Copiloto' },
    ])
  })
})


