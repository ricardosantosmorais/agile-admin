import { NextRequest, NextResponse } from 'next/server'
import { apiMessage, asRecord, decodeJsonArray, resolveWhatsappContext, whatsappApiFetch, withTenant } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function POST(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	let components: unknown[]
	try {
		components = decodeJsonArray(body.components_json ?? body.components, 'JSON de componentes')
	} catch (error) {
		return NextResponse.json({ message: error instanceof Error ? error.message : 'JSON de componentes inválido.' }, { status: 400 })
	}
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/templates', {
		method: 'POST',
		body: withTenant(resolved.context, {
			account_reference: String(body.account_reference || 'whatsapp-corporativo').trim(),
			template_name: String(body.template_name || '').trim(),
			language_code: String(body.language_code || 'pt_BR').trim(),
			category: String(body.category || 'UTILITY').trim(),
			components,
		}),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao criar template do WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload, message: 'Template oficial do WhatsApp criado com sucesso.' })
}

export async function DELETE(request: NextRequest) {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const body = asRecord(await request.json().catch(() => null))
	const result = await whatsappApiFetch(resolved.context, 'external-whatsapp/templates', {
		method: 'DELETE',
		body: withTenant(resolved.context, {
			account_reference: String(body.account_reference || 'whatsapp-corporativo').trim(),
			template_name: String(body.template_name || '').trim(),
			meta_template_id: String(body.meta_template_id || '').trim(),
		}),
	})
	if (!result.ok) {
		return NextResponse.json({ message: apiMessage(result.payload, 'Falha ao remover template do WhatsApp.') }, { status: result.status || 400 })
	}
	return NextResponse.json({ success: true, data: asRecord(result.payload).data ?? result.payload, message: 'Template oficial do WhatsApp removido com sucesso.' })
}
