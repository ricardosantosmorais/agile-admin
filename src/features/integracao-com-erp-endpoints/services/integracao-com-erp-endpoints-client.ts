import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { httpClient } from '@/src/services/http/http-client'

export type EndpointLookupOption = {
	id: string
	label: string
}

export type EndpointProfileRecord = {
	id: string
	idPerfil: string
	nomePerfil: string
}

export const integracaoComErpEndpointsClient = createCrudClient('/api/endpoints')

export async function loadEndpointQueryOptions(query: string, page: number, perPage: number) {
	const params = new URLSearchParams({
		mode: 'queries',
		page: String(page),
		perPage: String(perPage),
		q: query,
	})
	const response = await httpClient<{ data: EndpointLookupOption[] }>(`/api/endpoints?${params.toString()}`, {
		method: 'GET',
		cache: 'no-store',
	})
	return response.data
}

export async function loadEndpointTableOptions(query: string, page: number, perPage: number) {
	const params = new URLSearchParams({
		mode: 'tables',
		page: String(page),
		perPage: String(perPage),
		q: query,
	})
	const response = await httpClient<{ data: EndpointLookupOption[] }>(`/api/endpoints?${params.toString()}`, {
		method: 'GET',
		cache: 'no-store',
	})
	return response.data
}

export async function listEndpointProfiles(endpointId: string) {
	const params = new URLSearchParams({
		mode: 'profiles',
		idEndpoint: endpointId,
	})
	const response = await httpClient<{ data: EndpointProfileRecord[] }>(`/api/endpoints?${params.toString()}`, {
		method: 'GET',
		cache: 'no-store',
	})
	return response.data
}

export async function addEndpointProfile(endpointId: string, profile: string) {
	return httpClient<{ data: EndpointProfileRecord[] }>('/api/endpoints', {
		method: 'POST',
		body: JSON.stringify({ action: 'addProfile', id_endpoint: endpointId, perfil: profile }),
	})
}

export async function deleteEndpointProfile(endpointId: string, profileId: string) {
	return httpClient<{ data: EndpointProfileRecord[] }>('/api/endpoints', {
		method: 'DELETE',
		body: JSON.stringify({ action: 'deleteProfile', id_endpoint: endpointId, id_perfil: profileId }),
	})
}
