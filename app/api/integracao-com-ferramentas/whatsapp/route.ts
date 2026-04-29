import { NextResponse } from 'next/server'
import { apiMessage, apiV3BaseUrl, asRecord, resolveWhatsappContext, whatsappApiFetch } from '@/app/api/integracao-com-ferramentas/whatsapp/_shared'

export async function GET() {
	const resolved = await resolveWhatsappContext()
	if ('error' in resolved) return resolved.error
	const { context } = resolved

	const [setup, signupConfig] = await Promise.all([
		whatsappApiFetch(context, `external-whatsapp/provider-account?id_empresa=${encodeURIComponent(context.tenantId)}`),
		whatsappApiFetch(context, `external-whatsapp/embedded-signup/config?id_empresa=${encodeURIComponent(context.tenantId)}`),
	])

	if (!setup.ok) {
		return NextResponse.json({ message: apiMessage(setup.payload, 'Não foi possível carregar a configuração oficial do WhatsApp.') }, { status: setup.status || 400 })
	}

	const setupPayload = asRecord(setup.payload)
	const configPayload = asRecord(signupConfig.payload)
	return NextResponse.json({
		data: {
			...asRecord(setupPayload.data),
			signup_config: signupConfig.ok ? asRecord(configPayload.data) : {},
			webhook_url: `${apiV3BaseUrl()}/external-whatsapp/webhook`,
		},
	})
}
