import { iconNames } from 'lucide-react/dynamic.mjs'

export const ICON_PICKER_PAGE_SIZE = 72

const LUCIDE_ICON_NAMES = [...iconNames].sort((left, right) => left.localeCompare(right))
const LUCIDE_ICON_NAME_SET = new Set<string>(LUCIDE_ICON_NAMES)

const ICON_ALIASES: Record<string, string> = {
	chart: 'chart-no-axes-combined',
	dashboard: 'layout-dashboard',
	image: 'image',
}

export function isIconPickerImageValue(value: string) {
	return value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
}

function extractLegacyFontAwesomeName(value: string) {
	const normalized = value.trim().toLowerCase()
	const classMatch = normalized.match(/class=["']([^"']+)["']/)
	const classValue = classMatch?.[1] ?? normalized
	const faClass = classValue.split(/\s+/).find((item) => item.startsWith('fa-') && item !== 'fa' && item !== 'far' && item !== 'fas' && item !== 'fal' && item !== 'fab')
	return faClass?.replace(/^fa-/, '') ?? ''
}

export function normalizeIconPickerValue(value: string) {
	const normalized = value.trim()
	if (!normalized || isIconPickerImageValue(normalized)) {
		return normalized
	}

	const normalizedKey = normalized.toLowerCase()
	const aliased = ICON_ALIASES[normalizedKey] ?? normalizedKey
	if (LUCIDE_ICON_NAME_SET.has(aliased)) {
		return aliased
	}

	const legacy = extractLegacyFontAwesomeName(normalized)
	if (!legacy) {
		return normalized
	}

	if (legacy.includes('users-crown')) return 'crown'
	if (legacy.includes('users') || legacy.includes('user-friends')) return 'users'
	if (legacy.includes('user')) return 'user'
	if (legacy.includes('toolbox') || legacy.includes('tools') || legacy.includes('wrench')) return 'wrench'
	if (legacy.includes('cog') || legacy.includes('gear') || legacy.includes('sliders')) return 'settings'
	if (legacy.includes('shopping-cart') || legacy.includes('cart')) return 'shopping-cart'
	if (legacy.includes('box') || legacy.includes('boxes')) return 'boxes'
	if (legacy.includes('truck')) return 'truck'
	if (legacy.includes('credit-card') || legacy.includes('money') || legacy.includes('wallet')) return 'credit-card'
	if (legacy.includes('chart') || legacy.includes('analytics') || legacy.includes('report')) return 'chart-no-axes-combined'
	if (legacy.includes('database') || legacy.includes('server')) return 'database'
	if (legacy.includes('file') || legacy.includes('clipboard')) return 'file-text'
	if (legacy.includes('folder')) return 'folder'
	if (legacy.includes('bell')) return 'bell'
	if (legacy.includes('mail') || legacy.includes('envelope')) return 'mail'
	if (legacy.includes('shield') || legacy.includes('lock')) return 'shield'
	if (legacy.includes('tag')) return 'tag'
	if (legacy.includes('percent')) return 'percent'
	if (legacy.includes('search')) return 'search'
	if (legacy.includes('map') || legacy.includes('pin')) return 'map-pin'
	if (legacy.includes('star')) return 'star'
	if (legacy.includes('heart')) return 'heart'
	if (legacy.includes('poo-storm') || legacy.includes('bolt') || legacy.includes('magic')) return 'sparkles'

	return 'layout-grid'
}

export function isIconPickerIconValue(value: string) {
	return LUCIDE_ICON_NAME_SET.has(normalizeIconPickerValue(value))
}

export function filterIconPickerNames(query: string) {
	const normalizedQuery = query.trim().toLowerCase()
	if (!normalizedQuery) {
		return LUCIDE_ICON_NAMES
	}

	const terms = normalizedQuery.split(/\s+/).filter(Boolean)
	return LUCIDE_ICON_NAMES.filter((name) => terms.every((term) => name.includes(term)))
}

export function paginateIconPickerNames(names: string[], page: number, pageSize = ICON_PICKER_PAGE_SIZE) {
	const safePageSize = Math.max(pageSize, 1)
	const totalPages = Math.max(Math.ceil(names.length / safePageSize), 1)
	const currentPage = Math.min(Math.max(page, 1), totalPages)
	const start = (currentPage - 1) * safePageSize
	return {
		currentPage,
		totalPages,
		items: names.slice(start, start + safePageSize),
	}
}
