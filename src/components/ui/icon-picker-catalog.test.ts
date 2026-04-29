import { describe, expect, it } from 'vitest'
import {
	filterIconPickerNames,
	normalizeIconPickerValue,
	paginateIconPickerNames,
} from '@/src/components/ui/icon-picker-catalog'

describe('icon picker catalog', () => {
	it('exposes the Lucide catalog through searchable icon names', () => {
		const allIcons = filterIconPickerNames('')
		const cartIcons = filterIconPickerNames('cart')

		expect(allIcons.length).toBeGreaterThan(1000)
		expect(cartIcons).toContain('shopping-cart')
	})

	it('paginates the filtered catalog without leaking invalid pages', () => {
		expect(paginateIconPickerNames(['a', 'b', 'c', 'd', 'e'], 3, 2)).toEqual({
			currentPage: 3,
			totalPages: 3,
			items: ['e'],
		})

		expect(paginateIconPickerNames(['a', 'b', 'c'], -1, 2)).toMatchObject({
			currentPage: 1,
			items: ['a', 'b'],
		})
	})

	it('normalizes legacy FontAwesome markup and old shortcut keys', () => {
		expect(normalizeIconPickerValue('<i class="far fa-users-crown"></i>')).toBe('crown')
		expect(normalizeIconPickerValue('chart')).toBe('chart-no-axes-combined')
	})
})
