import type { LookupOption } from '@/src/components/ui/lookup-select'

export type FuncionalidadeEmpresa = {
	id: string
	nome: string
	codigo?: string
	ativo?: boolean
}

export type FuncionalidadeRecord = {
	id?: string
	ativo: boolean
	menu: boolean
	codigo?: string
	nome: string
	posicao: string | number
	nivel: string | number
	icone?: string
	url?: string
	componente?: string
	clique?: string
	acao?: string | null
	descricao?: string
	id_funcionalidade_pai?: string | null
	funcionalidade_pai_nome?: string
	funcionalidade_pai_lookup?: LookupOption | null
	empresas?: FuncionalidadeEmpresa[]
	[key: string]: unknown
}

export type FuncionalidadePayload = {
	id?: string
	ativo: boolean
	menu: boolean
	codigo: string
	nome: string
	posicao: number | null
	nivel: number | null
	icone: string
	url: string
	componente: string
	clique: string
	acao: string | null
	descricao: string
	id_funcionalidade_pai: string | null
}
