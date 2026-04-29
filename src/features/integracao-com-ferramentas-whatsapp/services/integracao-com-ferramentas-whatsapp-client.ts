import { httpClient } from '@/src/services/http/http-client'
import type { WhatsappApiResponse, WhatsappProviderForm, WhatsappSetup, WhatsappTemplateDraft, WhatsappTestDraft } from '@/src/features/integracao-com-ferramentas-whatsapp/services/integracao-com-ferramentas-whatsapp-types'

const basePath = '/api/integracao-com-ferramentas/whatsapp'

export const integracaoComFerramentasWhatsappClient = {
	async getSetup() {
		const response = await httpClient<{ data: WhatsappSetup }>(basePath)
		return response.data
	},

	saveProvider(payload: WhatsappProviderForm) {
		return httpClient<WhatsappApiResponse>(`${basePath}/provider`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},

	captureSessionEvent(payload: Record<string, unknown>) {
		return httpClient<WhatsappApiResponse>(`${basePath}/embedded-signup/session-event`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},

	exchangeCode(payload: Record<string, unknown>) {
		return httpClient<WhatsappApiResponse>(`${basePath}/embedded-signup/code-exchange`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},

	syncTemplates(accountReference: string) {
		return httpClient<WhatsappApiResponse>(`${basePath}/templates/sync`, {
			method: 'POST',
			body: JSON.stringify({ account_reference: accountReference }),
		})
	},

	createTemplate(payload: WhatsappTemplateDraft) {
		return httpClient<WhatsappApiResponse>(`${basePath}/templates`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},

	deleteTemplate(payload: { account_reference: string; template_name: string; meta_template_id: string }) {
		return httpClient<WhatsappApiResponse>(`${basePath}/templates`, {
			method: 'DELETE',
			body: JSON.stringify(payload),
		})
	},

	sendTest(payload: WhatsappTestDraft) {
		return httpClient<WhatsappApiResponse>(`${basePath}/test`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},
}
