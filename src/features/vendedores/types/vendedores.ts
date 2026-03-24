import type { LookupOption } from '@/src/components/ui/lookup-select'

export type VendedorType = 'PF' | 'PJ'
export type VendedorKind = 'ativo' | 'externo' | 'receptivo'

export type VendedorFormRecord = {
  id: string
  ativo: boolean
  bloqueado: boolean
  codigo: string
  codigo_ativacao: string
  tipo: VendedorType
  tipo_vendedor: VendedorKind
  cpf: string
  cnpj: string
  nome: string
  nome_fantasia: string
  id_filial: LookupOption | null
  id_supervisor: LookupOption | null
  id_canal_distribuicao: LookupOption | null
  email: string
  telefone: string
  celular: string
  canais_distribuicao: VendedorCanalDistribuicaoRelation[]
}

export type VendedorCanalDistribuicaoRelation = {
  id_vendedor: string
  id_canal_distribuicao: string
  limite_credito?: number | string | null
  canal_distribuicao?: {
    id: string
    nome?: string | null
  } | null
}

export type VendedorLinkedUser = {
  id: string
  idUsuario: string
  email: string
  nome?: string | null
}

