import { NextRequest, NextResponse } from 'next/server'
import { apiMessage, asRecord, resolveWhatsappContext, whatsappApiFetch, withTenant } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function POST(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	const sessionEvent = asRecord(body.session_event)
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/embedded-signup/code-exchange', {
		method: 'POST',
		body: withTenant(resolved.context, {
			account_reference: String(body.account_reference || 'whatsapp-corporativo').trim(),
			code: String(body.code || '').trim(),
			business_id: String(body.business_id || '').trim(),
			waba_id: String(body.waba_id || '').trim(),
			phone_number_id: String(body.phone_number_id || '').trim(),
			display_phone_number: String(body.display_phone_number || '').trim(),
			session_event: sessionEvent,
		}),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao concluir o Embedded Signup do WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload, message: 'Conta oficial do WhatsApp vinculada com sucesso via Meta.' })
}
