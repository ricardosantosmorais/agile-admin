import 'server-only';

export class IntercomApiError extends Error {
	status: number;
	payload: unknown;

	constructor(message: string, status: number, payload: unknown) {
		super(message);
		this.name = 'IntercomApiError';
		this.status = status;
		this.payload = payload;
	}
}

function getIntercomBaseUrl() {
	return (process.env.INTERCOM_API_BASE_URL || 'https://api.intercom.io').replace(/\/+$/, '');
}

function getIntercomToken() {
	const token = process.env.INTERCOM_TOKEN?.trim();
	if (!token) {
		throw new IntercomApiError('A integração com o Intercom não está configurada neste ambiente.', 500, {
			message: 'Missing INTERCOM_TOKEN environment variable',
		});
	}

	return token;
}

type IntercomFetchOptions = {
	method?: 'GET' | 'POST';
	body?: unknown;
};

export async function intercomFetch<T>(path: string, options: IntercomFetchOptions = {}) {
	const response = await fetch(`${getIntercomBaseUrl()}/${path.replace(/^\/+/, '')}`, {
		method: options.method ?? 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${getIntercomToken()}`,
			'Intercom-Version': '2.11',
		},
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
		cache: 'no-store',
	});

	const contentType = response.headers.get('content-type') ?? '';
	const payload = contentType.includes('application/json') ? await response.json() : await response.text();

	if (!response.ok) {
		const message =
			typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
				? payload.message
				: 'Não foi possível concluir a requisição ao Intercom.';

		throw new IntercomApiError(message, response.status, payload);
	}

	return payload as T;
}

export function getKnowledgeBaseParentId() {
	return Number(process.env.INTERCOM_ARTICLES_PARENT_ID || '8751216');
}
