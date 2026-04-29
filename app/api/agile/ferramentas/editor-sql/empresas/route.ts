import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

function asRecord(value: unknown) {
	return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
	return value == null ? '' : String(value).trim()
}

function getErrorMessage(payload: unknown, fallback: string) {
	const source = asRecord(payload)
	const error = asRecord(source.error)
	return asString(source.message || error.message || fallback)
}

function normalizePositiveInteger(value: string | null, fallback: number, max: number) {
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed < 1) {
		return fallback
	}

	return Math.min(Math.floor(parsed), max)
}

async function fetchCompaniesPage({ page, perPage, query, field }: { page: number; perPage: number; query: string; field?: string }) {
	const filters: Record<string, string | number> = {
		page,
		perpage: perPage,
		order: 'nome',
		sort: 'asc',
	}

	if (query && field) {
		filters[field] = query
	}

	return externalAdminApiFetch('painelb2b', 'agilesync_empresas', {
		method: 'GET',
		query: filters,
	})
}

function normalizeForSearch(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
}

function mapCompanies(payload: unknown) {
	const source = asRecord(payload)
	const rows = Array.isArray(source.data) ? source.data : []
	return rows.map((row) => {
		const item = asRecord(row)
		const id = asString(item.id)
		const nome = asString(item.nome)
		const codigo = asString(item.codigo)
		return {
			id,
			nome,
			codigo,
			label: [nome, codigo].filter(Boolean).join(' - ') || id,
			description: codigo && nome ? codigo : undefined,
		}
	}).filter((item) => item.id)
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const searchParams = request.nextUrl.searchParams
	const q = asString(searchParams.get('q'))
	const page = normalizePositiveInteger(searchParams.get('page'), 1, 1000)
	const perPage = normalizePositiveInteger(searchParams.get('perPage'), 15, 50)

	const response = q
		? await fetchCompaniesPage({ page: 1, perPage: 5000, query: '', field: undefined })
		: await fetchCompaniesPage({ page, perPage, query: '', field: undefined })

	if (!response.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(response.payload, 'Não foi possível carregar as empresas do AgileSync.') },
			{ status: response.status || 400 },
		)
	}

	const companies = mapCompanies(response.payload)
	const normalizedQuery = normalizeForSearch(q)
	const filtered = normalizedQuery
		? companies.filter((company) => [company.nome, company.codigo, company.id, company.label].some((value) => normalizeForSearch(value).includes(normalizedQuery)))
		: companies
	const offset = q ? (page - 1) * perPage : 0
	const data = q ? filtered.slice(offset, offset + perPage) : filtered

	return NextResponse.json({ data })
}
