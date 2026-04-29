import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'

function text(value: unknown) {
	return String(value ?? '').trim()
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const q = text(request.nextUrl.searchParams.get('q')).toLowerCase()

	const servicoResult = await agileV2Fetch('servicos', { method: 'GET', query: { perpage: 1, id } })
	if (!servicoResult.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(servicoResult.payload, 'Não foi possível carregar o serviço.') }, { status: servicoResult.status || 400 })
	}
	const servico = asArray<Record<string, unknown>>(asRecord(servicoResult.payload).data)[0] || {}
	const idTemplate = text(servico.id_template)

	const vinculosResult = await agileV2Fetch('servicos_empresas', { method: 'GET', query: { perpage: 1000, id_servico: id } })
	const vinculadas = new Set<string>()
	if (vinculosResult.ok) {
		for (const row of asArray<Record<string, unknown>>(asRecord(vinculosResult.payload).data)) {
			const idEmpresa = text(row.id_empresa)
			if (idEmpresa) vinculadas.add(idEmpresa)
		}
	}

	const empresasResult = await agileV2Fetch('empresas', {
		method: 'GET',
		query: {
			page: 1,
			perpage: 10000,
			order: 'nome_fantasia',
			sort: 'asc',
			...(idTemplate ? { id_template: idTemplate } : { 'id_template:null': '' }),
		},
	})
	if (!empresasResult.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(empresasResult.payload, 'Não foi possível carregar as empresas disponíveis.') }, { status: empresasResult.status || 400 })
	}

	const options = asArray<Record<string, unknown>>(asRecord(empresasResult.payload).data)
		.map((row) => {
			const optionId = text(row.id)
			const nome = text(row.nome_fantasia || row.razao_social) || `Empresa #${optionId}`
			return { id: optionId, label: optionId ? `#${optionId} - ${nome}` : nome }
		})
		.filter((option) => option.id && !vinculadas.has(option.id))
		.filter((option) => !q || option.id === q || option.label.toLowerCase().includes(q))
		.slice(0, 20)

	return NextResponse.json(options)
}

