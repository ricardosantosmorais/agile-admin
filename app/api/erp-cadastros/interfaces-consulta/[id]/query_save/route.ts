import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import {
	buildAliasValidation,
	jsonError,
	loadQueriesLookup,
	loadQueryAliases,
	loadQueryRow,
	postResource,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'
import { asRecord } from '@/src/lib/api-payload'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	try {
		const idTemplate = toStringValue(body.id_template)
		const idQuery = toStringValue(body.id_query)
		const nome = toStringValue(body.nome)
		const sql = toStringValue(body.sql)
		if (!idTemplate) throw new Error('Selecione o template da query.')
		if (!nome) throw new Error('Informe o nome da query.')
		if (!sql) throw new Error('Informe a query SQL.')
		const saved = await postResource('querys', {
			...(idQuery ? { id: idQuery } : {}),
			id_template: Number(idTemplate),
			nome,
			id_usuario: sessionOrResponse.currentUserId,
			query: sql,
			hash: createHash('md5').update(sql).digest('hex'),
			ativo: true,
			observacao: 'Editada via cadastro de interfaces',
		}, 'Falha ao salvar a query.')
		const savedId = toStringValue(saved.id || idQuery)
		if (!savedId) throw new Error('Não foi possível identificar a query salva.')
		const query = await loadQueryRow(savedId)
		return NextResponse.json({
			success: { message: 'Query salva com sucesso.' },
			query,
			aliases: await loadQueryAliases(savedId),
			queries: await loadQueriesLookup(idTemplate),
			validation: await buildAliasValidation(id, savedId, sql),
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível salvar a query.')
	}
}
