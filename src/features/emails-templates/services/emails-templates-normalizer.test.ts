import { describe, expect, it } from 'vitest'
import { normalizeEmailTemplateRecord } from '@/src/features/emails-templates/services/emails-templates-normalizer'

describe('emails-templates-normalizer', () => {
  it('normalizes booleans and nullables before save', () => {
    const result = normalizeEmailTemplateRecord({
      ativo: '1',
      envia_empresa: 1,
      envia_filial: '0',
      tempo_envio: '45',
      codigo: '',
      enviar_para: ' ',
      tipo: ' pedido_aprovado ',
      html: '<p>ok</p>',
    })

    expect(result.ativo).toBe(true)
    expect(result.envia_empresa).toBe(true)
    expect(result.envia_filial).toBe(false)
    expect(result.tempo_envio).toBe(45)
    expect(result.codigo).toBeNull()
    expect(result.enviar_para).toBeNull()
    expect(result.tipo).toBe('pedido_aprovado')
    expect(result.modelo).toBe('twig')
  })
})
