import type { LookupOption } from '@/src/components/ui/lookup-select'

export type SupervisorType = 'PF' | 'PJ'

export type SupervisorFormRecord = {
  id: string
  ativo: boolean
  bloqueado: boolean
  codigo: string
  codigo_ativacao: string
  tipo: SupervisorType
  cpf: string
  cnpj: string
  nome: string
  nome_fantasia: string
  id_filial: LookupOption | null
  id_canal_distribuicao: LookupOption | null
  email: string
  telefone: string
  celular: string
}
