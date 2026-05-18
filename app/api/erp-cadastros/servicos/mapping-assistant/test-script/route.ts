import { NextRequest, NextResponse } from 'next/server'
import { painelb2bFetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asRecord } from '@/src/lib/api-payload'

function isEmptyPayload(value: unknown) {
	if (value === null || value === undefined || value === '') return true
	if (Array.isArray(value)) return value.length === 0
	if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0
	return false
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

	const body = asRecord(await request.json().catch(() => ({})))
	const script = String(body.script || '').trim()
	const payloadTeste = body.payload_teste ?? body.payload_teste_json
	const modoTransformacaoGateway = String(body.modo_transformacao_gateway || 'registro').trim() === 'dataset_consolidado'
		? 'dataset_consolidado'
		: 'registro'

	if (!script) {
		return NextResponse.json({ message: 'Informe um script Razor para teste.' }, { status: 400 })
	}
	if (isEmptyPayload(payloadTeste)) {
		return NextResponse.json({ message: 'Carregue uma amostra do endpoint antes de testar o script.' }, { status: 400 })
	}

	const result = await painelb2bFetch('agilesync_build_script', {
		method: 'POST',
		body: {
			modo: 'gateway_mapeamento_preview',
			id_empresa: sessionOrResponse.currentTenantId,
			script,
			modo_transformacao_gateway: modoTransformacaoGateway,
			payload: JSON.stringify(payloadTeste),
		},
	})

	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível testar o script de mapeamento.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const data = asRecord(payload.data)
	const resultado = data.script_decodificao ?? payload.data ?? result.payload
	return NextResponse.json({ data: { resultado } })
}
