import { NextRequest, NextResponse } from 'next/server'
import { asArray, asRecord, extractApiErrorMessage, resolveConsultasContext, serverTenantFetch, toStringValue } from '@/app/api/consultas/_shared'
import { getSubmissionPersonDisplayDocument, getSubmissionPersonName } from '@/app/api/consultas/envios-de-formularios/_person'

function normalizeBooleanLabel(value: unknown) {
	return value === true || value === 1 || value === '1' ? 'Sim' : 'Não'
}

function formatDateTime(value: unknown) {
	const input = toStringValue(value)
	if (!input) return ''

	const parsed = new Date(input)
	if (Number.isNaN(parsed.getTime())) {
		return input
	}

	return parsed.toLocaleString('pt-BR')
}

export async function GET(request: NextRequest) {
	const contextResult = await resolveConsultasContext()
	if ('error' in contextResult) {
		return contextResult.error
	}

	const { context } = contextResult
	const searchParams = request.nextUrl.searchParams
	const mode = toStringValue(searchParams.get('mode'))

	if (mode === 'context') {
		const formsResult = await serverTenantFetch(context, 'formularios?perpage=10000&order=titulo')
		if (!formsResult.ok) {
			return NextResponse.json(
				{ message: extractApiErrorMessage(formsResult.payload, 'Não foi possível carregar os formulários disponíveis.') },
				{ status: formsResult.status || 400 },
			)
		}

		return NextResponse.json({
			data: {
				formularios: asArray(asRecord(formsResult.payload).data)
					.map((entry) => {
						const row = asRecord(entry)
						return {
							id: toStringValue(row.id),
							titulo: toStringValue(row.titulo || row.nome || row.id),
						}
					})
					.filter((entry) => entry.id),
			},
		})
	}

	const params = new URLSearchParams({
		page: searchParams.get('page') || '1',
		perpage: searchParams.get('perPage') || '15',
		order: searchParams.get('orderBy') || 'data',
		sort: searchParams.get('sort') || 'desc',
		embed: 'cliente,contato,formulario',
	})

	const idFormulario = toStringValue(searchParams.get('id_formulario'))
	if (idFormulario) {
		params.set('formulario:id', idFormulario)
	}

	const cliente = toStringValue(searchParams.get('cliente'))
	if (cliente) {
		const escaped = cliente.replace(/'/g, "''")
		params.set(
			'q',
			`(clientes.nome_fantasia like '%${escaped}%' or clientes.razao_social like '%${escaped}%' or contatos.nome_fantasia like '%${escaped}%' or contatos.razao_social like '%${escaped}%')`,
		)
	}

	const internalizado = toStringValue(searchParams.get('internalizado'))
	if (internalizado) {
		params.set('internalizado', internalizado)
	}

	const dataInicio = toStringValue(searchParams.get('data_inicio'))
	if (dataInicio) {
		params.set('created_at::ge', `${dataInicio} 00:00:00`)
	}

	const dataFim = toStringValue(searchParams.get('data_fim'))
	if (dataFim) {
		params.set('created_at::le', `${dataFim} 23:59:59`)
	}

	const result = await serverTenantFetch(context, `formularios_envios?${params.toString()}`)
	if (!result.ok) {
		return NextResponse.json(
			{ message: extractApiErrorMessage(result.payload, 'Não foi possível carregar os envios de formulários.') },
			{ status: result.status || 400 },
		)
	}

	const payload = asRecord(result.payload)
	return NextResponse.json({
		data: asArray(payload.data).map((entry) => {
			const row = asRecord(entry)
			const formulario = asRecord(row.formulario)

			return {
				id: toStringValue(row.id),
				formularioTitulo: toStringValue(formulario.titulo),
				formularioId: toStringValue(formulario.id),
				clienteNome: getSubmissionPersonName(row),
				clienteDocumento: getSubmissionPersonDisplayDocument(row),
				data: toStringValue(row.data),
				dataLabel: formatDateTime(row.data),
				internalizado: row.internalizado === true || row.internalizado === 1 || row.internalizado === '1',
				internalizadoLabel: normalizeBooleanLabel(row.internalizado),
			}
		}),
		meta: {
			page: Number(payload.meta && asRecord(payload.meta).page ? asRecord(payload.meta).page : 1),
			pages: Number(payload.meta && asRecord(payload.meta).pages ? asRecord(payload.meta).pages : 1),
			perPage: Number(payload.meta && asRecord(payload.meta).perpage ? asRecord(payload.meta).perpage : 15),
			from: Number(payload.meta && asRecord(payload.meta).from ? asRecord(payload.meta).from : 0),
			to: Number(payload.meta && asRecord(payload.meta).to ? asRecord(payload.meta).to : 0),
			total: Number(payload.meta && asRecord(payload.meta).total ? asRecord(payload.meta).total : 0),
		},
	})
}
