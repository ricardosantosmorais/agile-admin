import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { analyzeLegacyComponentContent, type LegacyComponentAnalysis } from '@/src/features/agile-ferramentas/services/sincronizar-modulos-parser'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
	return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray<T = unknown>(value: unknown): T[] {
	return Array.isArray(value) ? value as T[] : []
}

function asString(value: unknown) {
	return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function getErrorMessage(payload: unknown, fallback: string) {
	const source = asRecord(payload)
	const error = asRecord(source.error)
	return asString(source.message || error.message || fallback)
}

function resolveLegacyComponentsPath() {
	return (
		process.env.ADMIN_LEGACY_COMPONENTS_PATH
		|| process.env.ADMIN_LEGACY_ADMIN_COMPONENTS_PATH
		|| path.resolve(process.cwd(), '..', 'admin', 'components')
	)
}

async function collectPhpFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true })
	const files = await Promise.all(entries.map(async (entry) => {
		const fullPath = path.join(directory, entry.name)
		if (entry.isDirectory()) return collectPhpFiles(fullPath)
		if (entry.isFile() && entry.name.toLowerCase().endsWith('.php')) return [fullPath]
		return []
	}))

	return files.flat()
}

function firstTable(component: LegacyComponentAnalysis) {
	return Object.values(component)[0]
}

function getPayloadData(payload: unknown) {
	return asArray<ApiRecord>(asRecord(payload).data)
}

function getEmbeddedRows(value: unknown) {
	return Array.isArray(value) ? asArray<ApiRecord>(value) : getPayloadData(value)
}

function findByField(rows: ApiRecord[], field: string, value: string) {
	return rows.find((row) => asString(row[field]) === value) ?? null
}

async function readLegacyComponents(directory: string) {
	const files = await collectPhpFiles(directory)
	const entries = await Promise.all(files.map(async (filePath) => {
		const content = await readFile(filePath, 'utf8')
		return [path.basename(filePath), analyzeLegacyComponentContent(content)] as const
	}))

	return {
		files,
		componentsData: Object.fromEntries(entries) as Record<string, LegacyComponentAnalysis>,
	}
}

export async function POST() {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const componentsPath = resolveLegacyComponentsPath()
	try {
		const pathStat = await stat(componentsPath)
		if (!pathStat.isDirectory()) {
			return NextResponse.json({ message: 'O caminho configurado para componentes do legado não é uma pasta.' }, { status: 400 })
		}
	} catch {
		return NextResponse.json(
			{
				message: 'Não foi possível localizar a pasta de componentes do legado. Configure ADMIN_LEGACY_COMPONENTS_PATH para habilitar esta rotina.',
				componentesPath: componentsPath,
			},
			{ status: 400 },
		)
	}

	const { token, currentTenantId } = session
	const { files, componentsData } = await readLegacyComponents(componentsPath)
	const tableEntries = Object.values(componentsData).flatMap((component) => Object.values(component))
	const componentesResponse = await serverApiFetch('componentes?tipo=aplicacao&perpage=1000&order=nome', {
		method: 'GET',
		token,
		tenantId: currentTenantId,
	})
	const dicionariosResponse = await serverApiFetch('dicionarios_tabelas?embed=campos&perpage=1000&order=nome', {
		method: 'GET',
		token,
		tenantId: currentTenantId,
	})

	if (!componentesResponse.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(componentesResponse.payload, 'Não foi possível carregar os componentes atuais.') },
			{ status: componentesResponse.status || 400 },
		)
	}

	if (!dicionariosResponse.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(dicionariosResponse.payload, 'Não foi possível carregar o dicionário de tabelas.') },
			{ status: dicionariosResponse.status || 400 },
		)
	}

	let componentes = getPayloadData(componentesResponse.payload)
	const dicionariosTabelas = getPayloadData(dicionariosResponse.payload)
	const novosComponentes = Object.entries(componentsData).flatMap(([arquivo, component]) => {
		const table = firstTable(component)
		if (!table || findByField(componentes, 'arquivo', arquivo)) return []
		return [{ nome: table.table, tipo: 'aplicacao', arquivo }]
	})

	if (novosComponentes.length) {
		const createResponse = await serverApiFetch('componentes', {
			method: 'POST',
			token,
			tenantId: currentTenantId,
			body: novosComponentes,
		})
		if (!createResponse.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(createResponse.payload, 'Não foi possível criar os componentes detectados.') },
				{ status: createResponse.status || 400 },
			)
		}

		const refreshResponse = await serverApiFetch('componentes?tipo=aplicacao&perpage=1000&order=nome', {
			method: 'GET',
			token,
			tenantId: currentTenantId,
		})
		if (refreshResponse.ok) {
			componentes = getPayloadData(refreshResponse.payload)
		}
	}

	const tableLinks: Array<{ id_componente: string; id_dicionario_tabela: string }> = []
	const fieldLinks: Array<{ id_componente: string; id_dicionario_tabela: string; id_dicionario_tabela_campo: string }> = []
	let ignoredWithoutTable = 0
	let ignoredWithoutDictionary = 0
	const tableLinkKeys = new Set<string>()
	const fieldLinkKeys = new Set<string>()

	for (const [arquivo, component] of Object.entries(componentsData)) {
		const table = firstTable(component)
		if (!table) {
			ignoredWithoutTable += 1
			continue
		}

		const componente = findByField(componentes, 'arquivo', arquivo)
		const dicionarioTabela = findByField(dicionariosTabelas, 'nome', table.table)
		if (!componente || !dicionarioTabela) {
			ignoredWithoutDictionary += 1
			continue
		}

		const idComponente = asString(componente.id)
		const idDicionarioTabela = asString(dicionarioTabela.id)
		const tableKey = `${idComponente}:${idDicionarioTabela}`
		if (!tableLinkKeys.has(tableKey)) {
			tableLinks.push({ id_componente: idComponente, id_dicionario_tabela: idDicionarioTabela })
			tableLinkKeys.add(tableKey)
		}

		const campos = getEmbeddedRows(dicionarioTabela.campos)
		for (const field of table.fields) {
			const campo = findByField(campos, 'nome', field)
			if (!campo) continue
			const idCampo = asString(campo.id)
			const fieldKey = `${idComponente}:${idDicionarioTabela}:${idCampo}`
			if (fieldLinkKeys.has(fieldKey)) continue
			fieldLinks.push({
				id_componente: idComponente,
				id_dicionario_tabela: idDicionarioTabela,
				id_dicionario_tabela_campo: idCampo,
			})
			fieldLinkKeys.add(fieldKey)
		}
	}

	if (tableLinks.length) {
		const response = await serverApiFetch('componentes_tabelas', {
			method: 'POST',
			token,
			tenantId: currentTenantId,
			body: tableLinks,
		})
		if (!response.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(response.payload, 'Não foi possível salvar os vínculos de tabelas.') },
				{ status: response.status || 400 },
			)
		}
	}

	if (fieldLinks.length) {
		const response = await serverApiFetch('componentes_tabelas_campos', {
			method: 'POST',
			token,
			tenantId: currentTenantId,
			body: fieldLinks,
		})
		if (!response.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(response.payload, 'Não foi possível salvar os vínculos de campos.') },
				{ status: response.status || 400 },
			)
		}
	}

	return NextResponse.json({
		message: 'Módulos sincronizados com sucesso.',
		componentesPath: componentsPath,
		arquivosAnalisados: files.length,
		tabelasDetectadas: tableEntries.length,
		componentesCriados: novosComponentes.length,
		vinculosTabelas: tableLinks.length,
		vinculosCampos: fieldLinks.length,
		ignoradosSemTabela: ignoredWithoutTable,
		ignoradosSemDicionario: ignoredWithoutDictionary,
	})
}
