import { describe, expect, it } from 'vitest'
import { buildNotificacaoPainelPayload, normalizeNotificacaoPainelRecord, NOTIFICACAO_PAINEL_CHANNEL_OPTIONS } from '@/src/features/notificacoes-painel/services/notificacoes-painel-mappers'

describe('notificacoes-painel mappers', () => {
  it('normalizes API datetime fields to date inputs and linked companies', () => {
    const result = normalizeNotificacaoPainelRecord({
      id: '9',
      titulo: 'Aviso',
      ativo: 1,
      publicado: 0,
      registrar_changelog: '1',
      data_inicio: '2026-04-01 00:00:00',
      data_fim: '2026-04-30 23:59:59',
      empresas: [
        {
          id: '88',
          id_notificacao: '9',
          id_empresa: '42',
          empresa: { id: '42', nome_fantasia: 'Empresa Teste', codigo: 'ET' },
        },
      ],
    })

    expect(result.ativo).toBe(true)
    expect(result.publicado).toBe(false)
    expect(result.registrar_changelog).toBe(true)
    expect(result.data_inicio).toBe('2026-04-01')
    expect(result.data_fim).toBe('2026-04-30')
    expect(result.empresas).toEqual([
      { id: '88', id_notificacao: '9', id_empresa: '42', nome: 'Empresa Teste', codigo: 'ET' },
    ])
  })

  it('uses flattened company names before falling back to the company id', () => {
    const result = normalizeNotificacaoPainelRecord({
      id: '10',
      empresas: [
        {
          id: '99',
          id_notificacao: '10',
          id_empresa: '1773055669729164',
          nome_fantasia: 'Empresa pelo vínculo',
          codigo_empresa: '177',
        },
      ],
    })

    expect(result.empresas).toEqual([
      { id: '99', id_notificacao: '10', id_empresa: '1773055669729164', nome: 'Empresa pelo vínculo', codigo: '177' },
    ])
  })

  it('builds the legacy-compatible save payload', () => {
    const payload = buildNotificacaoPainelPayload({
      id: '10',
      titulo: 'Nova versão',
      canal: 'email',
      mensagem: '<p>Conteúdo</p>',
      data_inicio: '2026-04-10',
      data_fim: '2026-04-11',
      ativo: true,
      registrar_changelog: false,
      publicado: false,
    })

    expect(payload).toMatchObject({
      id: '10',
      titulo: 'Nova versão',
      canal: 'email',
      mensagem: '<p>Conteúdo</p>',
      data_inicio: '2026-04-10 00:00:00',
      data_fim: '2026-04-11 23:59:59',
      ativo: true,
      registrar_changelog: false,
      publicado: false,
    })
  })

  it('keeps only legacy-supported panel notification channels', () => {
    expect(NOTIFICACAO_PAINEL_CHANNEL_OPTIONS.map((option) => option.value)).toEqual(['todos', 'admin', 'email'])
  })
})
