import { NextRequest, NextResponse } from 'next/server'
import { apiMessage, asRecord, resolveWhatsappContext, whatsappApiFetch, withTenant } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function POST(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/provider-account', {
		method: 'POST',
		body: withTenant(resolved.context, {
			display_name: String(body.display_name || '').trim(),
			account_reference: String(body.account_reference || 'whatsapp-corporativo').trim(),
			business_id: String(body.business_id || '').trim(),
			waba_id: String(body.waba_id || '').trim(),
			phone_number_id: String(body.phone_number_id || '').trim(),
			display_phone_number: String(body.display_phone_number || '').trim(),
			graph_api_version: String(body.graph_api_version || 'v21.0').trim(),
			provider_status: String(body.provider_status || 'connected').trim(),
			enabled: body.enabled === true,
			consent_state: String(body.consent_state || 'granted').trim(),
			channel_status: String(body.channel_status || 'connected').trim(),
			meta_access_token: String(body.meta_access_token || '').trim(),
			webhook_verify_token: String(body.webhook_verify_token || '').trim(),
		}),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao salvar a configuração oficial do WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload, message: 'Configuração oficial do WhatsApp salva com sucesso.' })
}
