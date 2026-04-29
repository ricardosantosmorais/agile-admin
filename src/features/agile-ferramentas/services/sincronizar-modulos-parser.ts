export type LegacyComponentTableAnalysis = {
	table: string
	fields: string[]
}

export type LegacyComponentAnalysis = Record<string, LegacyComponentTableAnalysis>

function uniquePush(target: string[], value: string) {
	if (value && !target.includes(value)) {
		target.push(value)
	}
}

function ensureTable(result: LegacyComponentAnalysis, table: string) {
	if (!result[table]) {
		result[table] = { table, fields: [] }
	}
	return result[table]
}

function readMatches(pattern: RegExp, content: string) {
	return Array.from(content.matchAll(pattern))
}

export function analyzeLegacyComponentContent(content: string): LegacyComponentAnalysis {
	const result: LegacyComponentAnalysis = {}
	const tableVariableMap = new Map<string, string[]>()
	const currentVariableMap = new Map<string, string>()
	const embedTableFieldsMap = new Map<string, Map<string, string>>()
	const controlVariables = new Set(['_SESSION', '_REQUEST', '_GET'])
	const strippedContent = content.replace(/isset\(\$(\w+)\[['"](\w+)['"]\]\)/g, '')

	for (const match of readMatches(/\$(\w+)\s*=\s*get\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, strippedContent)) {
		const variable = match[1] ?? ''
		const table = match[2] ?? ''
		const queryString = match[3] ?? ''
		if (!variable || !table) continue

		tableVariableMap.set(variable, [table])
		currentVariableMap.set(variable, variable)
		ensureTable(result, table)

		const embedMatch = queryString.match(/embed=([^&'"]*)/)
		if (!embedMatch?.[1]) continue

		for (const embedTable of embedMatch[1].split(',').map((item) => item.trim()).filter(Boolean)) {
			ensureTable(result, embedTable)
			const embedTableKey = `${variable}_${embedTable}`
			tableVariableMap.set(embedTableKey, [embedTable])
			const embedMap = embedTableFieldsMap.get(variable) ?? new Map<string, string>()
			embedMap.set(embedTable, embedTableKey)
			embedTableFieldsMap.set(variable, embedMap)
		}
	}

	for (const match of readMatches(/\$(\w+)\s*=\s*\$(\w+)\[['"]data['"]\]\[0\]/g, strippedContent)) {
		const newVariable = match[1] ?? ''
		const oldVariable = match[2] ?? ''
		const oldKey = currentVariableMap.get(oldVariable)
		if (!newVariable || !oldKey) continue

		tableVariableMap.set(newVariable, tableVariableMap.get(oldKey) ?? [])
		currentVariableMap.set(newVariable, newVariable)
		const oldEmbedMap = embedTableFieldsMap.get(oldVariable)
		if (oldEmbedMap) embedTableFieldsMap.set(newVariable, new Map(oldEmbedMap))
	}

	for (const match of readMatches(/foreach\s*\(\s*\$(\w+)\[['"](\w+)['"]\]\s+as\s+\$(\w+)/g, strippedContent)) {
		const mainVar = match[1] ?? ''
		const embedTable = match[2] ?? ''
		const loopVar = match[3] ?? ''
		const embedTableKey = embedTableFieldsMap.get(mainVar)?.get(embedTable)
		if (!loopVar || !embedTableKey) continue

		tableVariableMap.set(loopVar, [embedTable])
		currentVariableMap.set(loopVar, embedTableKey)
	}

	const fieldScanContent = strippedContent.replace(/foreach\s*\(\s*\$(\w+)\[['"](\w+)['"]\]\s+as\s+\$(\w+)\s*\)/g, '')

	for (const match of readMatches(/\$(\w+)((?:\[['"]?\w+['"]?\])+)/g, fieldScanContent)) {
		const variable = match[1] ?? ''
		const fieldsExpression = match[2] ?? ''
		if (!variable || controlVariables.has(variable)) continue
		if (/\[['"]meta['"]\]\[['"]total['"]\]/.test(fieldsExpression)) continue
		if (/\[['"]data['"]\]\[0\]/.test(fieldsExpression)) continue
		if (/^\[['"]data['"]\]$/.test(fieldsExpression)) continue

		const currentVariable = currentVariableMap.get(variable)
		const tables = currentVariable ? tableVariableMap.get(currentVariable) : undefined
		if (!tables?.length) continue

		for (const fieldMatch of readMatches(/\[['"]?(\w+)['"]?\]/g, fieldsExpression)) {
			const field = fieldMatch[1] ?? ''
			for (const table of tables) {
				uniquePush(ensureTable(result, table).fields, field)
			}
		}
	}

	for (const match of readMatches(/getValue\(\s*\$(\w+)\s*,\s*['"]([^'"]+)['"]\s*\)/g, strippedContent)) {
		const variable = match[1] ?? ''
		const field = match[2] ?? ''
		const currentVariable = currentVariableMap.get(variable)
		const tables = currentVariable ? tableVariableMap.get(currentVariable) : undefined
		if (!tables?.length) continue

		for (const table of tables) {
			uniquePush(ensureTable(result, table).fields, field)
		}
	}

	return result
}
