import { NextRequest, NextResponse } from 'next/server'
import { apiMessage, asRecord, resolveWhatsappContext, whatsappApiFetch, withTenant } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function POST(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/templates/sync', {
		method: 'POST',
		body: withTenant(resolved.context, { account_reference: String(body.account_reference || 'whatsapp-corporativo').trim() }),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao sincronizar templates do WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload, message: 'Templates do WhatsApp sincronizados com sucesso.' })
}
