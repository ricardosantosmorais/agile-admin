export type WhatsappProviderForm = {
	enabled: boolean
	display_name: string
	account_reference: string
	business_id: string
	waba_id: string
	phone_number_id: string
	display_phone_number: string
	graph_api_version: string
	provider_status: string
	channel_status: string
	consent_state: string
	webhook_verify_token: string
	meta_access_token: string
}

export type WhatsappTemplate = {
	id?: string | number
	template_name?: string
	language_code?: string
	category?: string
	status?: string
	meta_template_id?: string
	components_json?: unknown[]
}

export type WhatsappSetup = {
	provider_account: Record<string, unknown>
	channel_config: Record<string, unknown>
	secrets: Record<string, unknown>
	templates: WhatsappTemplate[]
	summary: Record<string, unknown>
	embedded_signup: Record<string, unknown>
	webhook_events: Array<Record<string, unknown>>
	signup_config: Record<string, unknown>
	webhook_url: string
}

export type WhatsappTemplateDraft = {
	account_reference: string
	template_name: string
	language_code: string
	category: string
	components_json: string
}

export type WhatsappTestDraft = {
	account_reference: string
	mode: 'text' | 'template'
	phone_number_e164: string
	preview_url: boolean
	text: string
	template_name: string
	language_code: string
	components_json: string
}

export type WhatsappApiResponse<T = unknown> = {
	success?: boolean
	message?: string
	data?: T
}
