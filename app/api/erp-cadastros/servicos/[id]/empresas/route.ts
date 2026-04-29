import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'

function normalizeServicoEmpresa(row: Record<string, unknown>) {
	return {
		...row,
		id: String(row.id ?? ''),
		id_empresa: String(row.id_empresa ?? ''),
		empresa_nome: String(row.empresa_nome || row['empresas.nome_fantasia'] || row.nome_fantasia || row.razao_social || row.id_empresa || ''),
		intervalo_execucao: String(row.intervalo_execucao ?? ''),
		ativo: String(row.ativo ?? '1') !== '0',
	}
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params

	const result = await agileV2Fetch('servicos_empresas', {
		method: 'GET',
		query: {
			perpage: 1000,
			order: 'empresas.nome_fantasia',
			id_servico: id,
			join: 'empresas:nome_fantasia,razao_social,id',
		},
	})

	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar os vínculos de empresas.') }, { status: result.status || 400 })
	}

	return NextResponse.json({ data: asArray<Record<string, unknown>>(asRecord(result.payload).data).map(normalizeServicoEmpresa) })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	const linkId = String(body.id || '').trim()

	if (!linkId) {
		const idEmpresa = String(body.id_empresa || '').trim()
		if (!idEmpresa) {
			return NextResponse.json({ message: 'Selecione a empresa para vincular o serviço.' }, { status: 400 })
		}

		const servicoResult = await agileV2Fetch('servicos', { method: 'GET', query: { perpage: 1, id } })
		if (!servicoResult.ok) {
			return NextResponse.json({ message: getAgilePayloadMessage(servicoResult.payload, 'Serviço não encontrado para vincular.') }, { status: servicoResult.status || 400 })
		}
		const servico = asArray<Record<string, unknown>>(asRecord(servicoResult.payload).data)[0]
		if (!servico) {
			return NextResponse.json({ message: 'Serviço não encontrado para vincular.' }, { status: 404 })
		}

		const existingResult = await agileV2Fetch('servicos_empresas', { method: 'GET', query: { perpage: 1, id_servico: id, id_empresa: idEmpresa } })
		if (existingResult.ok && asArray<Record<string, unknown>>(asRecord(existingResult.payload).data).length) {
			return NextResponse.json({ message: 'Este serviço já está vinculado à empresa selecionada.' }, { status: 400 })
		}

		const result = await agileV2Fetch('servicos_empresas', {
			method: 'POST',
			body: {
				id_servico: id,
				id_empresa: idEmpresa,
				intervalo_execucao: String(servico.intervalo_execucao || ''),
				ativo: 0,
			},
		})
		if (!result.ok) {
			return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível vincular a empresa.') }, { status: result.status || 400 })
		}

		const rows = asArray<Record<string, unknown>>(asRecord(result.payload).data)
		return NextResponse.json({ data: rows.map(normalizeServicoEmpresa) })
	}

	const payload = {
		id: linkId,
		id_servico: id,
		id_empresa: String(body.id_empresa || ''),
		intervalo_execucao: String(body.intervalo_execucao || ''),
		ativo: String(body.ativo ?? '1') === '0' || body.ativo === false ? 0 : 1,
	}

	const result = await agileV2Fetch('servicos_empresas', { method: 'POST', body: payload })
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível salvar o vínculo da empresa.') }, { status: result.status || 400 })
	}

	const rows = asArray<Record<string, unknown>>(asRecord(result.payload).data)
	return NextResponse.json({ data: rows.map(normalizeServicoEmpresa) })
}

export async function DELETE(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const idVinculo = String(request.nextUrl.searchParams.get('id_vinculo') || '').trim()
	if (!idVinculo) {
		return NextResponse.json({ message: 'Vínculo não informado para desvincular.' }, { status: 400 })
	}

	const result = await agileV2Fetch(`servicos_empresas/${idVinculo}`, { method: 'DELETE' })
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Falha ao desvincular o serviço da empresa.') }, { status: result.status || 400 })
	}

	return NextResponse.json({ success: { message: 'Serviço desvinculado da empresa com sucesso.' } })
}
