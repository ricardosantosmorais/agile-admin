import type { CrudRecord } from '@/src/components/crud-base/types'

export type ComponenteCampoRecord = CrudRecord & {
  id: string
  id_componente?: string | number | null
  ativo?: boolean | number | string
  obrigatorio?: boolean | number | string
  codigo?: string | null
  nome?: string | null
  titulo?: string | null
  instrucoes?: string | null
  tipo?: string | null
  tipo_seletor?: string | null
  json_seletor?: string | null | Array<{ titulo?: string; valor?: string }>
  posicao?: string | number | null
}

export type ComponenteCampoOption = {
  titulo: string
  valor: string
}
