import { NextRequest, NextResponse } from 'next/server'
import { apiMessage, asRecord, resolveWhatsappContext, whatsappApiFetch, withTenant } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function POST(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	const payload = asRecord(body.payload)
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/embedded-signup/session-event', {
		method: 'POST',
		body: withTenant(resolved.context, {
			...payload,
			account_reference: String(body.account_reference || payload.account_reference || 'whatsapp-corporativo').trim(),
			event: String(body.event || payload.event || '').trim(),
			event_type: String(body.event_type || payload.event_type || '').trim(),
			business_id: String(body.business_id || payload.business_id || '').trim(),
			waba_id: String(body.waba_id || payload.waba_id || '').trim(),
			phone_number_id: String(body.phone_number_id || payload.phone_number_id || '').trim(),
			display_phone_number: String(body.display_phone_number || payload.display_phone_number || '').trim(),
		}),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao registrar o evento do Embedded Signup do WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload })
}
