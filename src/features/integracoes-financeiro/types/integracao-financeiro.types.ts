/**
 * Tipos para o módulo Integrações > Financeiro
 *
 * Estrutura de dados para configuração de:
 * - Gateways de pagamento por filial (Boleto, Cartão, PIX)
 * - Antifraude ClearSale (credenciais e configurações)
 * - Antifraude Konduto (credenciais)
 */

/**
 * Metadata de auditoria para cada campo parametrizado
 */
export type FinanceiroFieldMeta = {
  updatedAt: string // Format: "YYYY-MM-DD HH:MM:SS"
  updatedBy: string // Nome do usuário que alterou
}

/**
 * Gateway de pagamento (leitura)
 */
export type GatewayPagamento = {
  id: string
  nome: string
  tipo: 'boleto_antecipado' | 'cartao_credito' | 'pix'
  createdAt?: string
}

/**
 * Configuração de gateway por filial (tabelas de Boleto, Cartão, PIX)
 */
export type FinanceiroGatewayBranchRow = {
  id: string // ID da filial
  nome: string // Nome da filial (fantasia)
  gatewayBoleto: string // ID do gateway para boleto (ou vazio)
  gatewayCartao: string // ID do gateway para cartão (ou vazio)
  gatewayPix: string // ID do gateway para PIX (ou vazio)
  updatedAtBoleto?: FinanceiroFieldMeta
  updatedAtCartao?: FinanceiroFieldMeta
  updatedAtPix?: FinanceiroFieldMeta
}

/**
 * Configurações globais de antifraude ClearSale
 */
export type ClearSaleConfig = {
  ambiente: 'producao' | 'teste' | ''
  login: string
  senha: string
  fingerprint: string
  modoBb2B2c: 'B2B' | 'B2C' | ''
  customSla: string // Minutos em texto
  enviaPix: 'S' | 'N' | ''
}

/**
 * Metadata específica para ClearSale
 */
export type ClearSaleFieldMeta = {
  ambiente?: FinanceiroFieldMeta
  login?: FinanceiroFieldMeta
  senha?: FinanceiroFieldMeta
  fingerprint?: FinanceiroFieldMeta
  modoBb2B2c?: FinanceiroFieldMeta
  customSla?: FinanceiroFieldMeta
  enviaPix?: FinanceiroFieldMeta
}

/**
 * Configurações globais de antifraude Konduto
 */
export type KondutoConfig = {
  ambiente: 'producao' | 'teste' | ''
  chavePublica: string
  chavePrivada: string
}

/**
 * Metadata específica para Konduto
 */
export type KondutoFieldMeta = {
  ambiente?: FinanceiroFieldMeta
  chavePublica?: FinanceiroFieldMeta
  chavePrivada?: FinanceiroFieldMeta
}

/**
 * Registro completo carregado do GET
 * Agrupa valores globais, metadados e dados por filial
 */
export type IntegracaoFinanceiroRecord = {
  gateways: GatewayPagamento[]
  branches: FinanceiroGatewayBranchRow[]
  clearSale: ClearSaleConfig
  clearSaleMetadata: ClearSaleFieldMeta
  konduto: KondutoConfig
  kondutoMetadata: KondutoFieldMeta
}

/**
 * Payload enviado para POST (formato API-v3)
 * Cada parâmetro é um objeto com chave e valor
 */
export type IntegracaoFinanceiroParameterPayload = {
  id_filial: string | null // null = global, string = filial
  chave: string // Ex: 'id_gateway_pagamento_boleto_antecipado'
  parametros: string // Valor armazenado
  integracao: number // 0 por padrão
  criptografado: number // 1 se deve criptografar (senha/chave privada), 0 caso contrário
}

/**
 * Chaves de parâmetros conhecidas (para type-safety)
 */
export const FINANCEIRO_PARAMETER_KEYS = {
  // Versão/controle
  VERSION: 'versao',

  // Gateways por filial
  GATEWAY_BOLETO: 'id_gateway_pagamento_boleto_antecipado',
  GATEWAY_CARTAO: 'id_gateway_pagamento_cartao_credito',
  GATEWAY_PIX: 'id_gateway_pagamento_pix',

  // ClearSale
  CLEARSALE_AMBIENTE: 'clearsale_ambiente',
  CLEARSALE_LOGIN: 'clearsale_login',
  CLEARSALE_SENHA: 'clearsale_senha',
  CLEARSALE_FINGERPRINT: 'clearsale_fingerprint',
  CLEARSALE_B2B_B2C: 'clearsale_b2b_b2c',
  CLEARSALE_CUSTOM_SLA: 'clearsale_custom_sla',
  CLEARSALE_ENVIA_PIX: 'clearsale_envia_pix',

  // Konduto
  KONDUTO_AMBIENTE: 'konduto_ambiente',
  KONDUTO_CHAVE_PUBLICA: 'konduto_chave_publica',
  KONDUTO_CHAVE_PRIVADA: 'konduto_chave_privada',
} as const

/**
 * Tipos de gateway (filtro na listagem)
 */
export const GATEWAY_TIPOS = {
  BOLETO_ANTECIPADO: 'boleto_antecipado',
  CARTAO_CREDITO: 'cartao_credito',
  PIX: 'pix',
} as const
