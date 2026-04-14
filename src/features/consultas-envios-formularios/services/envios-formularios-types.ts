export type EnvioFormularioFilters = {
	page: number
	perPage: number
	orderBy: string
	sort: 'asc' | 'desc'
	id_formulario: string
	cliente: string
	data_inicio: string
	data_fim: string
	internalizado: string
}

export type EnvioFormularioRecord = {
	id: string
	formularioTitulo: string
	formularioId: string
	clienteNome: string
	clienteDocumento: string
	data: string
	dataLabel: string
	internalizado: boolean
	internalizadoLabel: string
}

export type EnvioFormularioListResponse = {
	data: EnvioFormularioRecord[]
	meta: {
		page: number
		pages: number
		perPage: number
		from: number
		to: number
		total: number
	}
}

export type EnvioFormularioContext = {
	formularios: Array<{ id: string; titulo: string }>
}

export type EnvioFormularioDetail = {
	id: string
	formularioTitulo: string
	data: string
	clienteNome: string
	clienteDocumento: string
	campos: Array<{
		id: string
		titulo: string
		tipo: string
		valor: string
		arquivoUrl: string
	}>
}
