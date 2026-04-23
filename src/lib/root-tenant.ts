import { normalizeSearchValue } from '@/src/lib/text-normalization'

export function isRootAgileecommerceTenant(tenantId: string) {
	return normalizeSearchValue(tenantId) === 'agileecommerce'
}

export function isRootAgileecommerceAdmin(session: {
	currentTenant?: { id?: string | null } | null
	user?: { master?: boolean | null } | null
} | null | undefined) {
	return isRootAgileecommerceTenant(String(session?.currentTenant?.id ?? '')) && session?.user?.master === true
}
