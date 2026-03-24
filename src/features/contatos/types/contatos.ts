export type ContatoStatus = 'recebido' | 'aprovado' | 'reprovado'

export type ContatoListFilters = {
  page: number
  perPage: number
  orderBy: string
  sort: 'asc' | 'desc'
  cnpj_cpf: string
  'nome_fantasia::like': string
  'pessoa_contato::like': string
  'email::like': string
  'telefone1::like': string
  'celular::like': string
  'created_at::ge': string
  'created_at::le': string
  status: string
}

export type ContatoListItem = {
  id: string
  cnpj_cpf: string
  nome_fantasia: string
  pessoa_contato: string
  email: string
  telefone1: string
  celular: string
  created_at: string
  status: ContatoStatus
}

export type ContatoFormField = {
  campo?: {
    titulo?: string | null
    tipo?: string | null
  } | null
  valor?: string | null
}

export type ContatoFormSection = {
  formulario?: {
    titulo?: string | null
  } | null
  data?: string | null
  dados?: ContatoFormField[] | null
}

export type ContatoDetail = {
  id: string
  status: ContatoStatus
  internalizado?: boolean | null
  created_at?: string | null
  ip?: string | null
  tipo?: 'PF' | 'PJ' | null
  cnpj_cpf?: string | null
  nome_fantasia?: string | null
  razao_social?: string | null
  inscricao_estadual?: string | null
  tipo_cliente?: 'C' | 'R' | 'F' | null
  ramo_atividade?: string | null
  sexo?: 'M' | 'F' | null
  rg?: string | null
  data_nascimento?: string | null
  pessoa_contato?: string | null
  cargo?: string | null
  email?: string | null
  telefone1?: string | null
  telefone2?: string | null
  celular?: string | null
  ddd1?: string | null
  ddd2?: string | null
  ddd_celular?: string | null
  whatsapp?: boolean | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
  codigo_ibge?: string | null
  ponto_referencia?: string | null
  segmento?: {
    nome?: string | null
  } | null
  formularios?: ContatoFormSection[] | null
}
