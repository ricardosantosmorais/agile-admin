import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudResource } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'

export async function loadErpCatalogLookup(resource: CrudResource, query: string, page: number, perPage: number): Promise<LookupOption[]> {
	const options = await loadCrudLookupOptions(resource, query, page, perPage)
	return options.map((option) => ({ id: option.value, label: option.label }))
}
