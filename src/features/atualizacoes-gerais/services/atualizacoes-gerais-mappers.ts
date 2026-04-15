import type { AtualizacaoGeralGroup, AtualizacaoGeralItem } from '@/src/features/atualizacoes-gerais/services/atualizacoes-gerais-types';

function parseDate(value: string) {
	const normalized = value.includes('T') ? value : value.replace(' ', 'T');
	const date = new Date(normalized);
	return Number.isNaN(date.getTime()) ? null : date;
}

function formatGroupTitle(value: string, locale: string) {
	const date = parseDate(value);
	if (!date) {
		return locale.startsWith('pt') ? 'Sem data' : 'No date';
	}

	const title = new Intl.DateTimeFormat(locale, {
		month: 'long',
		year: 'numeric',
	}).format(date);

	return title.charAt(0).toUpperCase() + title.slice(1);
}

function getGroupKey(value: string) {
	const date = parseDate(value);
	if (!date) {
		return 'sem-data';
	}

	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function filterVisibleUpdates(items: AtualizacaoGeralItem[], isMaster: boolean) {
	return items.filter((item) => isMaster || !item.apenasMaster);
}

export function groupUpdatesByMonth(items: AtualizacaoGeralItem[], locale: string): AtualizacaoGeralGroup[] {
	const groups = new Map<string, AtualizacaoGeralGroup>();

	for (const item of items) {
		const key = getGroupKey(item.data);
		if (!groups.has(key)) {
			groups.set(key, {
				key,
				title: formatGroupTitle(item.data, locale),
				items: [],
			});
		}

		groups.get(key)?.items.push(item);
	}

	return Array.from(groups.values());
}
