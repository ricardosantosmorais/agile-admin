export type ConfiguracoesAssistenteVirtualFieldKey =
  | 'ia_ativo'
  | 'ia_nome'
  | 'ia_avatar'
  | 'ia_mensagem_mix_cliente'
  | 'ia_mensagem_mix_segmento'
  | 'ia_mensagem_alta_preco'
  | 'ia_mensagem_falta'
  | 'ia_mensagem_frequencia_compra'
  | 'ia_mensagem_recomendados'

export type ConfiguracoesAssistenteVirtualSectionKey =
  | 'general'
  | 'messages'

export type ConfiguracoesAssistenteVirtualFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesAssistenteVirtualFormValues = Record<ConfiguracoesAssistenteVirtualFieldKey, string>

export type ConfiguracoesAssistenteVirtualRecord = {
  values: ConfiguracoesAssistenteVirtualFormValues
  metadata: Partial<Record<ConfiguracoesAssistenteVirtualFieldKey, ConfiguracoesAssistenteVirtualFieldMeta>>
}

