import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'

export { isRootAgileecommerceTenant }

export type ChangelogAdminRecord = {
	id?: string
	ativo?: boolean | number | string
	apenas_master?: boolean | number | string
	data?: string | null
	plataforma?: string | null
	tipo?: string | null
	titulo?: string | null
	conteudo?: string | null
	[key: string]: unknown
}

export function normalizeChangelogAdminRecord(record: ChangelogAdminRecord) {
	const sourceDate = String(record.data ?? '').trim()
	const normalizedDate = sourceDate ? sourceDate.slice(0, 10) : ''

	return {
		...record,
		data_original: sourceDate,
		data: normalizedDate,
		ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
		apenas_master: record.apenas_master === true || record.apenas_master === 1 || record.apenas_master === '1',
	}
}

export function buildChangelogAdminPayload(record: ChangelogAdminRecord) {
	const payload: Record<string, unknown> = {
		...record,
		ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
		apenas_master: record.apenas_master === true || record.apenas_master === 1 || record.apenas_master === '1',
		plataforma: String(record.plataforma ?? '').trim().toLowerCase(),
		tipo: String(record.tipo ?? '').trim().toLowerCase(),
		titulo: String(record.titulo ?? '').trim(),
		conteudo: String(record.conteudo ?? '').trim(),
	}

	const dateValue = String(record.data ?? '').trim()
	payload.data = dateValue ? `${dateValue} 00:00:00` : ''

	return payload
}
