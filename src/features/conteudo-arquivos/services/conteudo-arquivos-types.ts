export type ConteudoArquivosFilters = {
	page: number
	perPage: number
	orderBy: 'id' | 'arquivo' | 'data_envio'
	sort: 'asc' | 'desc'
	id: string
	arquivo: string
	data_inicio: string
	data_fim: string
}

export type ConteudoArquivoRecord = {
	id: string
	arquivoUrl: string
	arquivoNome: string
	pasta: string
	extensao: string
	isPreviewable: boolean
	dataEnvio: string
	dataEnvioLabel: string
}

export type ConteudoArquivosListResponse = {
	data: ConteudoArquivoRecord[]
	meta: {
		page: number
		pages: number
		perPage: number
		from: number
		to: number
		total: number
	}
}

export const CONTEUDO_ARQUIVOS_ACCEPT: Record<string, string[]> = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'image/gif': ['.gif'],
	'application/pdf': ['.pdf'],
	'application/msword': ['.doc'],
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
	'application/vnd.ms-excel': ['.xls'],
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
	'application/vnd.ms-powerpoint': ['.ppt'],
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
	'text/csv': ['.csv'],
	'text/html': ['.html'],
	'text/plain': ['.txt'],
	'application/zip': ['.zip'],
}

export const CONTEUDO_ARQUIVOS_FORMATS_LABEL = 'JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, HTML, TXT ou ZIP'
