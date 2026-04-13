const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(locale: string) {
	const cached = formatterCache.get(locale);
	if (cached) {
		return cached;
	}

	const formatter = new Intl.DateTimeFormat(locale, {
		dateStyle: 'short',
		timeStyle: 'short',
	});

	formatterCache.set(locale, formatter);
	return formatter;
}

export function formatDateTime(value: string, locale = 'pt-BR') {
	const normalized = value.includes('T') ? value : value.replace(' ', 'T');
	const date = new Date(normalized);
	return Number.isNaN(date.getTime()) ? value : getDateTimeFormatter(locale).format(date);
}
