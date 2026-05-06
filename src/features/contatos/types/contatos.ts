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
  internalizado?: boolean | number | string | null
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
  internalizado?: boolean | number | string | null
  codigo?: string | null
  perfil?: string | null
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
  id_segmento?: string | null
  pessoa_contato?: string | null
  cargo?: string | null
  email?: string | null
  telefone1?: string | null
  telefone2?: string | null
  celular?: string | null
  ddd1?: string | null
  ddd2?: string | null
  ddd_celular?: string | null
  whatsapp?: boolean | number | string | null
  news?: boolean | number | string | null
  ativo?: boolean | number | string | null
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
    id?: string | null
    nome?: string | null
  } | null
  formularios?: ContatoFormSection[] | null
}

export type ContatoEditFormValues = {
  id: string
  status: ContatoStatus
  codigo: string
  perfil: string
  tipo: string
  tipo_cliente: string
  cnpj_cpf: string
  nome_fantasia: string
  razao_social: string
  inscricao_estadual: string
  pessoa_contato: string
  cargo: string
  ramo_atividade: string
  email: string
  sexo: string
  rg: string
  data_nascimento: string
  id_segmento: string
  ddd1: string
  telefone1: string
  ddd2: string
  telefone2: string
  ddd_celular: string
  celular: string
  whatsapp: boolean
  news: boolean
  ativo: boolean
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  codigo_ibge: string
  ponto_referencia: string
}
