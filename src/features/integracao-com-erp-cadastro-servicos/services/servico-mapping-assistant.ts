const PREFERRED_LABEL_KEYS = ['id', 'codigo', 'nome', 'descricao', 'sku', 'ean', 'referencia']

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function isMeaningfulObject(value: unknown) {
	return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0
}

function pickPreviewPayload(result: unknown) {
	const root = asRecord(result)
	const data = root.data
	return isMeaningfulObject(data) ? asRecord(data) : root
}

export function extractSampleRows(result: unknown): unknown[] {
	const payload = pickPreviewPayload(result)
	const dataArray = payload.data_array ?? payload.dataArray
	const dataArraySample = payload.data_array_sample ?? payload.dataArraySample
	const responseRaw = payload.response_raw ?? payload.responseRaw ?? payload.raw ?? result

	if (Array.isArray(dataArray) && dataArray.length) return dataArray
	if (isMeaningfulObject(dataArraySample) || (dataArraySample !== undefined && dataArraySample !== null && dataArraySample !== '')) {
		return [dataArraySample]
	}
	if (Array.isArray(responseRaw) && responseRaw.length) return responseRaw

	const responseRecord = asRecord(responseRaw)
	if (Array.isArray(responseRecord.data) && responseRecord.data.length) return responseRecord.data
	if (isMeaningfulObject(responseRaw)) return [responseRaw]

	return []
}

export function buildSampleRowLabel(row: unknown, index: number) {
	const prefix = `#${index + 1}`
	const record = asRecord(row)
	if (!isMeaningfulObject(record)) return `${prefix} | ${String(row ?? '-')}`

	const parts: string[] = []
	for (const key of PREFERRED_LABEL_KEYS) {
		if (parts.length >= 2) break
		const value = record[key]
		if (value === undefined || value === null || value === '') continue
		parts.push(`${key}=${String(value)}`)
	}

	if (!parts.length) {
		for (const [key, value] of Object.entries(record)) {
			if (parts.length >= 2) break
			if (value === undefined || value === null || value === '' || typeof value === 'object') continue
			parts.push(`${key}=${String(value)}`)
		}
	}

	return parts.length ? `${prefix} | ${parts.join(' | ')}` : `${prefix} | Registro ${index + 1}`
}

export function buildSamplePayload(row: unknown, datasetMode: boolean) {
	if (row === null || row === undefined) return null
	if (datasetMode) return row
	if (typeof row === 'object') return { data: [row] }
	return { data: [{ valor: row }] }
}

export function formatAssistantJson(value: unknown) {
	try {
		return JSON.stringify(value ?? {}, null, 2)
	} catch {
		return '{}'
	}
}
