import { describe, expect, it } from 'vitest'
import { isRootAgileecommerceAdmin, isRootAgileecommerceTenant } from '@/src/lib/root-tenant'

describe('root-tenant', () => {
	it('identifica o tenant root agileecommerce', () => {
		expect(isRootAgileecommerceTenant('agileecommerce')).toBe(true)
		expect(isRootAgileecommerceTenant('AGILEECOMMERCE')).toBe(true)
		expect(isRootAgileecommerceTenant('1698203521854804')).toBe(false)
	})

	it('identifica sessao de administrador root agileecommerce', () => {
		expect(
			isRootAgileecommerceAdmin({
				currentTenant: { id: 'agileecommerce' },
				user: { master: true },
			}),
		).toBe(true)

		expect(
			isRootAgileecommerceAdmin({
				currentTenant: { id: 'agileecommerce' },
				user: { master: false },
			}),
		).toBe(false)

		expect(
			isRootAgileecommerceAdmin({
				currentTenant: { id: '123' },
				user: { master: true },
			}),
		).toBe(false)
	})
})
