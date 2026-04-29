import { NextRequest, NextResponse } from 'next/server'
import { apiMessage, asRecord, decodeJsonArray, resolveWhatsappContext, whatsappApiFetch, withTenant } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function POST(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	const mode = String(body.mode || 'text').trim()
	const payload: Record<string, unknown> = {
		account_reference: String(body.account_reference || 'whatsapp-corporativo').trim(),
		mode,
		phone_number_e164: String(body.phone_number_e164 || '').trim(),
		preview_url: body.preview_url === true,
	}
	if (mode === 'template') {
		try {
			payload.template_name = String(body.template_name || '').trim()
			payload.language_code = String(body.language_code || 'pt_BR').trim()
			payload.components = decodeJsonArray(body.components_json ?? body.components, 'JSON de componentes')
		} catch (error) {
			return NextResponse.json({ message: error instanceof Error ? error.message : 'JSON de componentes inválido.' }, { status: 400 })
		}
	} else {
		payload.text = String(body.text || '').trim()
	}
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/provider-account/test', {
		method: 'POST',
		body: withTenant(resolved.context, payload),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao executar envio de teste no WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload, message: 'Envio de teste executado com sucesso.' })
}
